import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AssignmentRequest {
  moaiId?: string;
  operation: 'create_cycle' | 'assign_mid_cycle' | 'validate_system' | 'handle_leave';
  profileId?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { moaiId, operation, profileId }: AssignmentRequest = await req.json();

    console.log(`Enhanced buddy system operation: ${operation}`, { moaiId, profileId });

    let result;

    switch (operation) {
      case 'create_cycle':
        result = await createEnhancedBuddyCycle(supabase, moaiId);
        break;
      case 'assign_mid_cycle':
        if (!profileId || !moaiId) {
          throw new Error('profileId and moaiId required for mid-cycle assignment');
        }
        result = await assignMidCycleBuddy(supabase, profileId, moaiId);
        break;
      case 'validate_system':
        result = await validateBuddySystem(supabase, moaiId);
        break;
      case 'handle_leave':
        if (!profileId || !moaiId) {
          throw new Error('profileId and moaiId required for leave handling');
        }
        result = await handleMemberLeave(supabase, profileId, moaiId);
        break;
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        operation,
        result
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in enhanced buddy cycle assignment:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

async function createEnhancedBuddyCycle(supabase: any, targetMoaiId?: string) {
  const currentCycleStart = new Date();
  currentCycleStart.setDate(currentCycleStart.getDate() - currentCycleStart.getDay() + 1); // Monday
  currentCycleStart.setHours(0, 0, 0, 0);
  
  const currentCycleEnd = new Date(currentCycleStart);
  currentCycleEnd.setDate(currentCycleEnd.getDate() + 13); // 2 weeks

  console.log('Starting enhanced bi-weekly buddy cycle assignment for cycle:', currentCycleStart.toISOString());

  // Get moais to process
  const moaiQuery = supabase
    .from('moais')
    .select('id, name')
    .eq('is_active', true);

  if (targetMoaiId) {
    moaiQuery.eq('id', targetMoaiId);
  }

  const { data: moais, error: moaisError } = await moaiQuery;

  if (moaisError) {
    console.error('Error fetching moais:', moaisError);
    throw moaisError;
  }

  let totalAssignments = 0;
  let processedMoais = 0;

  for (const moai of moais) {
    console.log(`Processing moai: ${moai.name} (${moai.id})`);
    
    // Check if cycle already exists for this moai
    const { data: existingCycle } = await supabase
      .from('buddy_cycles')
      .select('id')
      .eq('moai_id', moai.id)
      .eq('cycle_start_date', currentCycleStart.toISOString().split('T')[0])
      .single();

    if (existingCycle) {
      console.log(`Cycle already exists for moai ${moai.id}, skipping`);
      continue;
    }

    // Archive previous cycle's buddy chats
    await supabase
      .from('buddy_chat_channels')
      .update({ is_active: false })
      .eq('moai_id', moai.id)
      .eq('is_active', true);

    // Create new buddy cycle
    const { data: newCycle, error: cycleError } = await supabase
      .from('buddy_cycles')
      .insert({
        moai_id: moai.id,
        cycle_start_date: currentCycleStart.toISOString().split('T')[0],
        cycle_end_date: currentCycleEnd.toISOString().split('T')[0]
      })
      .select()
      .single();

    if (cycleError) {
      console.error(`Error creating buddy cycle for moai ${moai.id}:`, cycleError);
      continue;
    }

    // Get all active members and late joiners
    const { data: allMembers, error: membersError } = await supabase
      .from('moai_members')
      .select('profile_id')
      .eq('moai_id', moai.id)
      .eq('is_active', true);

    if (membersError || !allMembers || allMembers.length < 2) {
      console.log(`Not enough members for buddy assignments in moai ${moai.id}`);
      continue;
    }

    // Get late joiners from previous cycle
    const { data: lateJoiners } = await supabase
      .from('buddy_member_state')
      .select('profile_id')
      .eq('moai_id', moai.id)
      .eq('was_late_joiner', true);

    // Prioritize late joiners in assignment
    const memberIds = allMembers.map(m => m.profile_id);
    const lateJoinerIds = lateJoiners?.map(lj => lj.profile_id) || [];
    
    // Sort members to prioritize late joiners
    const prioritizedMembers = [
      ...lateJoinerIds.filter(id => memberIds.includes(id)),
      ...memberIds.filter(id => !lateJoinerIds.includes(id))
    ];

    // Get previous 8 weeks of pairings to avoid recent repeats
    const { data: previousPairings } = await supabase
      .from('buddy_cycle_pairings')
      .select('buddy_group')
      .eq('moai_id', moai.id)
      .gte('created_at', new Date(Date.now() - 8 * 7 * 24 * 60 * 60 * 1000).toISOString());

    const previousGroups = previousPairings?.map(p => p.buddy_group) || [];

    // Create enhanced optimal pairings
    const pairings = createEnhancedOptimalPairings(prioritizedMembers, previousGroups, lateJoinerIds);

    // Insert buddy pairings and create chat channels
    for (const pairing of pairings) {
      const buddyType = pairing.length === 2 ? 'buddy_1on1' : 'buddy_group';
      
      // Insert pairing
      await supabase
        .from('buddy_cycle_pairings')
        .insert({
          cycle_id: newCycle.id,
          moai_id: moai.id,
          buddy_group: pairing,
          buddy_type: buddyType,
          was_mid_cycle_assignment: false
        });

      // Create chat channel
      const chatName = buddyType === 'buddy_1on1' ? 'Buddy Chat' : 'Buddy Group Chat';
      
      await supabase
        .from('buddy_chat_channels')
        .insert({
          moai_id: moai.id,
          buddy_group: pairing,
          chat_name: chatName,
          cycle_start_date: currentCycleStart.toISOString().split('T')[0],
          cycle_end_date: currentCycleEnd.toISOString().split('T')[0],
          buddy_type: buddyType,
          is_active: true,
          week_start_date: currentCycleStart.toISOString().split('T')[0]
        });

      totalAssignments++;
      console.log(`Created ${buddyType} for group:`, pairing);

      // Send enhanced notifications
      for (const memberId of pairing) {
        const isLateJoiner = lateJoinerIds.includes(memberId);
        const notificationContent = isLateJoiner 
          ? 'Welcome to your new buddy group! You\'re all caught up. 🤝'
          : 'You have new accountability buddies for the next 2 weeks! 🤝';

        await supabase
          .from('notifications')
          .insert({
            profile_id: memberId,
            type: 'buddy_assignment',
            content: notificationContent,
            related_entity_id: moai.id
          });

        // Update member state
        await supabase
          .from('buddy_member_state')
          .upsert({
            profile_id: memberId,
            moai_id: moai.id,
            current_buddy_group: pairing,
            last_assignment_date: currentCycleStart.toISOString().split('T')[0],
            was_late_joiner: false, // Reset flag
            updated_at: new Date().toISOString()
          });
      }
    }

    processedMoais++;
  }

  console.log(`Enhanced buddy cycle assignment completed. Processed ${processedMoais} moais, total assignments: ${totalAssignments}`);

  return {
    processedMoais,
    totalAssignments,
    cycleStart: currentCycleStart.toISOString(),
    cycleEnd: currentCycleEnd.toISOString()
  };
}

async function assignMidCycleBuddy(supabase: any, profileId: string, moaiId: string) {
  const { data, error } = await supabase.rpc('assign_mid_cycle_buddy', {
    p_profile_id: profileId,
    p_moai_id: moaiId
  });

  if (error) throw error;
  return data;
}

async function validateBuddySystem(supabase: any, moaiId?: string) {
  const { data, error } = await supabase.rpc('validate_buddy_system_integrity', {
    p_moai_id: moaiId || null
  });

  if (error) throw error;
  return data;
}

async function handleMemberLeave(supabase: any, profileId: string, moaiId: string) {
  const { data, error } = await supabase.rpc('handle_member_leave_buddy_system', {
    p_profile_id: profileId,
    p_moai_id: moaiId
  });

  if (error) throw error;
  return data;
}

function createEnhancedOptimalPairings(memberIds: string[], previousGroups: any[], lateJoinerIds: string[]): string[][] {
  const members = [...memberIds];
  const pairings: string[][] = [];
  
  // Enhanced shuffle that prioritizes late joiners but still randomizes
  const lateJoiners = members.filter(id => lateJoinerIds.includes(id));
  const regularMembers = members.filter(id => !lateJoinerIds.includes(id));
  
  // Shuffle both groups separately
  for (let i = lateJoiners.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [lateJoiners[i], lateJoiners[j]] = [lateJoiners[j], lateJoiners[i]];
  }
  
  for (let i = regularMembers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [regularMembers[i], regularMembers[j]] = [regularMembers[j], regularMembers[i]];
  }
  
  // Interleave late joiners and regular members for better distribution
  const shuffledMembers: string[] = [];
  const maxLength = Math.max(lateJoiners.length, regularMembers.length);
  
  for (let i = 0; i < maxLength; i++) {
    if (i < lateJoiners.length) shuffledMembers.push(lateJoiners[i]);
    if (i < regularMembers.length) shuffledMembers.push(regularMembers[i]);
  }
  
  // Try to avoid recent pairings with enhanced logic
  const MAX_ATTEMPTS = 15;
  let attempt = 0;
  
  while (attempt < MAX_ATTEMPTS) {
    const currentPairings: string[][] = [];
    const remainingMembers = [...shuffledMembers];
    
    while (remainingMembers.length > 0) {
      if (remainingMembers.length === 1) {
        // Add lone member to smallest group (preferably making it a trio)
        if (currentPairings.length > 0) {
          const smallestGroup = currentPairings.reduce((smallest, current) => 
            current.length < smallest.length ? current : smallest
          );
          smallestGroup.push(remainingMembers[0]);
        }
        break;
      } else if (remainingMembers.length === 3) {
        // Create a trio
        currentPairings.push([remainingMembers[0], remainingMembers[1], remainingMembers[2]]);
        break;
      } else {
        // Create a pair
        currentPairings.push([remainingMembers[0], remainingMembers[1]]);
        remainingMembers.splice(0, 2);
      }
    }
    
    // Enhanced validation: check if this arrangement avoids recent pairings
    let hasRecentPairing = false;
    for (const pairing of currentPairings) {
      for (const prevGroup of previousGroups) {
        const prevGroupArray = Array.isArray(prevGroup) ? prevGroup : Object.values(prevGroup);
        if (hasSameMembers(pairing, prevGroupArray)) {
          hasRecentPairing = true;
          break;
        }
      }
      if (hasRecentPairing) break;
    }
    
    if (!hasRecentPairing) {
      return currentPairings;
    }
    
    // Re-shuffle for next attempt (only regular members, keep late joiner priority)
    for (let i = regularMembers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [regularMembers[i], regularMembers[j]] = [regularMembers[j], regularMembers[i]];
    }
    
    attempt++;
  }
  
  // If we can't avoid recent pairings after max attempts, return the last attempt
  const finalPairings: string[][] = [];
  const remainingMembers = [...shuffledMembers];
  
  while (remainingMembers.length > 0) {
    if (remainingMembers.length === 1) {
      if (finalPairings.length > 0) {
        const smallestGroup = finalPairings.reduce((smallest, current) => 
          current.length < smallest.length ? current : smallest
        );
        smallestGroup.push(remainingMembers[0]);
      }
      break;
    } else if (remainingMembers.length === 3) {
      finalPairings.push([remainingMembers[0], remainingMembers[1], remainingMembers[2]]);
      break;
    } else {
      finalPairings.push([remainingMembers[0], remainingMembers[1]]);
      remainingMembers.splice(0, 2);
    }
  }
  
  return finalPairings;
}

function hasSameMembers(group1: string[], group2: string[]): boolean {
  if (group1.length !== group2.length) return false;
  const sorted1 = [...group1].sort();
  const sorted2 = [...group2].sort();
  return sorted1.every((id, index) => id === sorted2[index]);
}
