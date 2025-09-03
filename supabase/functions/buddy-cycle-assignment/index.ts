import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    const currentCycleStart = new Date();
    currentCycleStart.setDate(currentCycleStart.getDate() - currentCycleStart.getDay() + 1); // Monday
    currentCycleStart.setHours(0, 0, 0, 0);
    
    const currentCycleEnd = new Date(currentCycleStart);
    currentCycleEnd.setDate(currentCycleEnd.getDate() + 13); // 2 weeks (14 days total)

    console.log('Starting bi-weekly buddy cycle assignment for cycle:', currentCycleStart.toISOString());

    // Get all active moais
    const { data: moais, error: moaisError } = await supabase
      .from('moais')
      .select('id, name')
      .eq('is_active', true);

    if (moaisError) {
      console.error('Error fetching moais:', moaisError);
      throw moaisError;
    }

    let totalAssignments = 0;

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
      const { error: archiveError } = await supabase
        .from('buddy_chat_channels')
        .update({ is_active: false })
        .eq('moai_id', moai.id)
        .eq('is_active', true);

      if (archiveError) {
        console.error(`Error archiving previous buddy chats for moai ${moai.id}:`, archiveError);
      }

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

      // Get all active members of the moai
      const { data: members, error: membersError } = await supabase
        .from('moai_members')
        .select('profile_id')
        .eq('moai_id', moai.id)
        .eq('is_active', true);

      if (membersError || !members || members.length < 2) {
        console.log(`Not enough members for buddy assignments in moai ${moai.id}`);
        continue;
      }

      const memberIds = members.map(m => m.profile_id);

      // Get previous 4 cycles of pairings to avoid recent repeats
      const { data: previousPairings } = await supabase
        .from('buddy_cycle_pairings')
        .select('buddy_group')
        .eq('moai_id', moai.id)
        .gte('created_at', new Date(Date.now() - 8 * 7 * 24 * 60 * 60 * 1000).toISOString()); // Last 8 weeks

      const previousGroups = previousPairings?.map(p => p.buddy_group) || [];

      // Create optimal pairings
      const pairings = createOptimalPairings(memberIds, previousGroups);

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
            buddy_type: buddyType
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
            is_active: true
          });

        totalAssignments++;
        console.log(`Created ${buddyType} for group:`, pairing);

        // Send notifications to new buddies
        for (const memberId of pairing) {
          await supabase
            .from('notifications')
            .insert({
              profile_id: memberId,
              type: 'buddy_assignment',
              content: 'You have new accountability buddies for the next 2 weeks! 🤝',
              related_entity_id: moai.id
            });
        }
      }
    }

    console.log(`Bi-weekly buddy cycle assignment completed. Total assignments: ${totalAssignments}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Bi-weekly buddy cycle assignment completed. Total assignments: ${totalAssignments}`,
        cycleStart: currentCycleStart.toISOString(),
        cycleEnd: currentCycleEnd.toISOString(),
        totalAssignments
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in buddy cycle assignment:', error);
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

function createOptimalPairings(memberIds: string[], previousGroups: any[]): string[][] {
  const members = [...memberIds];
  const pairings: string[][] = [];
  
  // Shuffle for randomization
  for (let i = members.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [members[i], members[j]] = [members[j], members[i]];
  }
  
  // Try to avoid recent pairings
  const MAX_ATTEMPTS = 10;
  let attempt = 0;
  
  while (attempt < MAX_ATTEMPTS) {
    const currentPairings: string[][] = [];
    const remainingMembers = [...members];
    
    while (remainingMembers.length > 0) {
      if (remainingMembers.length === 1) {
        // Add lone member to last group (making it a trio)
        if (currentPairings.length > 0) {
          currentPairings[currentPairings.length - 1].push(remainingMembers[0]);
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
    
    // Check if this arrangement avoids recent pairings
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
    
    // Shuffle again for next attempt
    for (let i = members.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [members[i], members[j]] = [members[j], members[i]];
    }
    
    attempt++;
  }
  
  // If we can't avoid recent pairings after max attempts, return the last attempt
  const finalPairings: string[][] = [];
  const remainingMembers = [...members];
  
  while (remainingMembers.length > 0) {
    if (remainingMembers.length === 1) {
      if (finalPairings.length > 0) {
        finalPairings[finalPairings.length - 1].push(remainingMembers[0]);
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