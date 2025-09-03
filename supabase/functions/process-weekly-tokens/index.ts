import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Database {
  public: {
    Tables: {
      moai_tokens: {
        Row: {
          id: string
          user_id: string
          moai_id: string | null
          source_type: string
          points: number
          awarded_on: string
          week_start_date: string | null
          created_at: string
        }
        Insert: {
          user_id: string
          moai_id?: string | null
          source_type: string
          points: number
          awarded_on?: string
          week_start_date?: string | null
        }
      }
      profiles: {
        Row: {
          id: string
          token_balance: number
        }
        Update: {
          token_balance?: number
        }
      }
      moais: {
        Row: {
          id: string
          name: string
          current_tier: number
          moai_success_this_week: boolean
          tier_advanced_this_week: boolean
          stone_earned_this_week: boolean
        }
        Update: {
          moai_success_this_week?: boolean
          tier_advanced_this_week?: boolean
          stone_earned_this_week?: boolean
        }
      }
      moai_members: {
        Row: {
          profile_id: string
          moai_id: string
          is_active: boolean
        }
      }
      user_commitments: {
        Row: {
          profile_id: string
          moai_id: string
          week_start_date: string
          movement_days_goal: number
          is_completed: boolean
        }
      }
      member_check_ins: {
        Row: {
          member_id: string
          moai_id: string
          week_start_date: string
          goal_met: boolean
        }
      }
      group_stones: {
        Row: {
          moai_id: string
          stone_number: number
          unlocked_at: string
        }
      }
    }
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient<Database>(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Calculate current week start (Monday) in PT timezone
    const now = new Date()
    const ptOffset = -8 * 60 // PT is UTC-8 (assuming standard time)
    const ptNow = new Date(now.getTime() + ptOffset * 60000)
    
    // Get the start of the current week (Monday)
    const currentWeekStart = new Date(ptNow)
    currentWeekStart.setDate(ptNow.getDate() - ptNow.getDay() + 1)
    currentWeekStart.setHours(0, 0, 0, 0)
    
    const weekStartStr = currentWeekStart.toISOString().split('T')[0]

    console.log('Processing weekly tokens for week:', weekStartStr)

    // Step 1: Process weekly commitment tokens
    await processWeeklyCommitmentTokens(supabase, weekStartStr)

    // Step 2: Process Moai progression tokens (tier and stone bonuses)
    await processMoaiProgressionTokens(supabase, weekStartStr)

    // Step 3: Reset weekly flags for next week
    await resetWeeklyFlags(supabase)

    return new Response(
      JSON.stringify({ success: true, week: weekStartStr }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error processing weekly tokens:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})

async function processWeeklyCommitmentTokens(supabase: any, weekStartStr: string) {
  console.log('Processing weekly commitment tokens...')

  // Get all active users with their Moai memberships
  const { data: users, error: usersError } = await supabase
    .from('moai_members')
    .select(`
      profile_id,
      moai_id,
      moais!inner(id, name)
    `)
    .eq('is_active', true)

  if (usersError) {
    console.error('Error fetching users:', usersError)
    return
  }

  // Group users by profile_id to handle multiple Moai memberships
  const userMoais = new Map<string, Array<{ moai_id: string, moai_name: string }>>()
  users.forEach(user => {
    if (!userMoais.has(user.profile_id)) {
      userMoais.set(user.profile_id, [])
    }
    userMoais.get(user.profile_id)?.push({
      moai_id: user.moai_id,
      moai_name: user.moais.name
    })
  })

  for (const [userId, moaiList] of userMoais) {
    await processUserCommitmentTokens(supabase, userId, moaiList, weekStartStr)
  }
}

async function processUserCommitmentTokens(
  supabase: any, 
  userId: string, 
  moaiList: Array<{ moai_id: string, moai_name: string }>, 
  weekStartStr: string
) {
  let succeededMoais = 0
  let userMetPersonalCommitment = false

  // Check each Moai for success and user's personal commitment
  for (const moai of moaiList) {
    // Check if this Moai succeeded (80% of members met their goals)
    const { data: checkIns } = await supabase
      .from('member_check_ins')
      .select('goal_met')
      .eq('moai_id', moai.moai_id)
      .eq('week_start_date', weekStartStr)

    if (checkIns && checkIns.length > 0) {
      const successRate = checkIns.filter(c => c.goal_met).length / checkIns.length
      if (successRate >= 0.8) {
        succeededMoais++
        
        // Award +100 tokens for this Moai success
        await awardTokens(supabase, {
          user_id: userId,
          moai_id: moai.moai_id,
          source_type: 'commitment_moai',
          points: 100,
          week_start_date: weekStartStr
        })
        
        console.log(`Awarded 100 tokens to user ${userId} for Moai ${moai.moai_name} success`)
      }
    }

    // Check if user met their personal commitment in this Moai
    const { data: userCheckIn } = await supabase
      .from('member_check_ins')
      .select('goal_met')
      .eq('member_id', userId)
      .eq('moai_id', moai.moai_id)
      .eq('week_start_date', weekStartStr)
      .single()

    if (userCheckIn?.goal_met) {
      userMetPersonalCommitment = true
    }
  }

  // Award individual success bonus ONLY if NO Moais succeeded AND user met personal commitment
  if (succeededMoais === 0 && userMetPersonalCommitment) {
    await awardTokens(supabase, {
      user_id: userId,
      source_type: 'commitment_individual',
      points: 50,
      week_start_date: weekStartStr
    })
    
    console.log(`Awarded 50 individual tokens to user ${userId} (no Moai success but personal commitment met)`)
  }
}

async function processMoaiProgressionTokens(supabase: any, weekStartStr: string) {
  console.log('Processing Moai progression tokens...')

  // Get all active Moais
  const { data: moais, error: moaisError } = await supabase
    .from('moais')
    .select('*')
    .eq('is_active', true)

  if (moaisError) {
    console.error('Error fetching moais:', moaisError)
    return
  }

  for (const moai of moais) {
    // Check for tier advancement
    if (moai.tier_advanced_this_week) {
      await awardProgressionTokensToMoaiMembers(
        supabase, 
        moai.id, 
        'tier', 
        50, 
        weekStartStr
      )
      console.log(`Awarded tier advancement tokens to Moai ${moai.name}`)
    }

    // Check for stone achievement
    if (moai.stone_earned_this_week) {
      await awardProgressionTokensToMoaiMembers(
        supabase, 
        moai.id, 
        'stone', 
        100, 
        weekStartStr
      )
      console.log(`Awarded stone achievement tokens to Moai ${moai.name}`)
    }
  }
}

async function awardProgressionTokensToMoaiMembers(
  supabase: any, 
  moaiId: string, 
  sourceType: string, 
  points: number, 
  weekStartStr: string
) {
  // Get all active members of this Moai
  const { data: members } = await supabase
    .from('moai_members')
    .select('profile_id')
    .eq('moai_id', moaiId)
    .eq('is_active', true)

  if (members) {
    for (const member of members) {
      await awardTokens(supabase, {
        user_id: member.profile_id,
        moai_id: moaiId,
        source_type: sourceType,
        points: points,
        week_start_date: weekStartStr
      })
    }
  }
}

async function awardTokens(supabase: any, tokenData: {
  user_id: string
  moai_id?: string
  source_type: string
  points: number
  week_start_date: string
}) {
  // Check if tokens already awarded to prevent duplicates
  const { data: existing } = await supabase
    .from('moai_tokens')
    .select('id')
    .eq('user_id', tokenData.user_id)
    .eq('source_type', tokenData.source_type)
    .eq('week_start_date', tokenData.week_start_date)
    .eq('moai_id', tokenData.moai_id || null)

  if (existing && existing.length > 0) {
    console.log(`Tokens already awarded for user ${tokenData.user_id}, source ${tokenData.source_type}`)
    return
  }

  // Insert token record
  const { error: tokenError } = await supabase
    .from('moai_tokens')
    .insert(tokenData)

  if (tokenError) {
    console.error('Error inserting token:', tokenError)
    return
  }

  // Update user's token balance
  const { error: balanceError } = await supabase.rpc('increment_token_balance', {
    user_id: tokenData.user_id,
    amount: tokenData.points
  })

  if (balanceError) {
    console.error('Error updating token balance:', balanceError)
  }
}

async function resetWeeklyFlags(supabase: any) {
  console.log('Resetting weekly flags...')

  const { error } = await supabase
    .from('moais')
    .update({
      moai_success_this_week: false,
      tier_advanced_this_week: false,
      stone_earned_this_week: false
    })
    .eq('is_active', true)

  if (error) {
    console.error('Error resetting weekly flags:', error)
  }
}