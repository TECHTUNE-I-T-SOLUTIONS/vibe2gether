import { createClient } from './client'

// ============================================================
// POSTS OPERATIONS
// ============================================================

export async function getPosts(limit = 20, offset = 0) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('posts')
    .select(`
      id,
      content,
      tags,
      media,
      likes_count,
      comments_count,
      saves_count,
      views_count,
      created_at,
      updated_at,
      user_id,
      is_public,
      allow_comments,
      location_name,
      user:users(
        id,
        display_name,
        profile_picture,
        bio
      )
    `)
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  return { data, error }
}

export async function getUserPosts(userId: string, limit = 20, offset = 0) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('posts')
    .select(`
      id,
      content,
      tags,
      media,
      likes_count,
      comments_count,
      saves_count,
      views_count,
      created_at,
      updated_at,
      user_id,
      is_public,
      allow_comments,
      user:users(
        id,
        display_name,
        profile_picture
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  return { data, error }
}

export async function createPost(
  userId: string,
  content: string,
  media: any[] = [],
  tags: string[] = [],
  locationName?: string,
  latitude?: number,
  longitude?: number
) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('posts')
    .insert({
      user_id: userId,
      content,
      tags: tags || [],
      media: media || [],
      location_name: locationName,
      latitude,
      longitude,
      is_public: true,
      allow_comments: true,
    })
    .select()

  return { data, error }
}

export async function getSavedPosts(userId: string, limit = 20, offset = 0) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('saved_posts')
    .select(`
      id,
      created_at,
      post:posts(
        id,
        content,
        media,
        likes_count,
        comments_count,
        saves_count,
        views_count,
        created_at,
        user_id,
        user:users(
          id,
          display_name,
          profile_picture
        )
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  return { data, error }
}

export async function savePost(userId: string, postId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('saved_posts')
    .insert({
      user_id: userId,
      post_id: postId,
    })
    .select()

  return { data, error }
}

export async function unsavePost(userId: string, postId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('saved_posts')
    .delete()
    .eq('user_id', userId)
    .eq('post_id', postId)

  return { data, error }
}

// ============================================================
// MATCHES OPERATIONS
// ============================================================

export async function getMatches(userId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('matches')
    .select(`
      id,
      user1_id,
      user2_id,
      status,
      compatibility_score,
      last_message_at,
      created_at,
      user1:users!matches_user1_id_fkey(
        id,
        display_name,
        profile_picture,
        bio,
        gender,
        age,
        country,
        interests
      ),
      user2:users!matches_user2_id_fkey(
        id,
        display_name,
        profile_picture,
        bio,
        gender,
        age,
        country,
        interests
      )
    `)
    .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
    .eq('status', 'accepted')

  return { data, error }
}

export async function getMatchesWithPending(userId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('matches')
    .select(`
      id,
      user1_id,
      user2_id,
      status,
      compatibility_score,
      created_at,
      user1:users!matches_user1_id_fkey(
        id,
        display_name,
        profile_picture,
        bio,
        gender,
        country,
        interests
      ),
      user2:users!matches_user2_id_fkey(
        id,
        display_name,
        profile_picture,
        bio,
        gender,
        country,
        interests
      )
    `)
    .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)

  return { data, error }
}

export async function createMatch(user1Id: string, user2Id: string, compatibilityScore: number) {
  const supabase = createClient()
  
  // Ensure consistent ordering (smaller id first)
  const [firstId, secondId] = user1Id < user2Id ? [user1Id, user2Id] : [user2Id, user1Id]

  const { data, error } = await supabase
    .from('matches')
    .insert({
      user1_id: firstId,
      user2_id: secondId,
      status: 'pending',
      initiated_by: user1Id,
      compatibility_score: compatibilityScore,
    })
    .select()

  return { data, error }
}

export async function updateMatchStatus(matchId: string, status: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('matches')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', matchId)
    .select()

  return { data, error }
}

// ============================================================
// EVENTS OPERATIONS
// ============================================================

export async function getEvents(limit = 20, offset = 0) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('events')
    .select(`
      id,
      title,
      description,
      category,
      event_date,
      event_end_date,
      location_name,
      thumbnail,
      capacity,
      registered_count,
      ticket_price,
      is_free,
      status,
      tags,
      created_at,
      created_by,
      organizer:users(
        id,
        display_name,
        profile_picture
      )
    `)
    .eq('status', 'upcoming')
    .order('event_date', { ascending: true })
    .range(offset, offset + limit - 1)

  return { data, error }
}

export async function getEventById(eventId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('events')
    .select(`
      id,
      title,
      description,
      category,
      event_date,
      event_end_date,
      location_name,
      thumbnail,
      capacity,
      registered_count,
      ticket_price,
      is_free,
      status,
      tags,
      created_at,
      created_by,
      organizer:users(
        id,
        display_name,
        profile_picture,
        bio
      )
    `)
    .eq('id', eventId)
    .single()

  return { data, error }
}

export async function getUserEvents(userId: string, limit = 20, offset = 0) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('created_by', userId)
    .order('event_date', { ascending: true })
    .range(offset, offset + limit - 1)

  return { data, error }
}

export async function createEvent(
  userId: string,
  event: {
    title: string
    description: string
    category: string
    event_date: string
    event_end_date?: string
    location_name?: string
    thumbnail?: string
    capacity?: number
    ticket_price?: number
    is_free?: boolean
    tags?: string[]
  }
) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('events')
    .insert({
      created_by: userId,
      ...event,
      status: 'upcoming',
      registered_count: 0,
    })
    .select()

  return { data, error }
}

export async function updateEvent(eventId: string, updates: any) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('events')
    .update(updates)
    .eq('id', eventId)
    .select()
    .single()

  return { data, error }
}

export async function deleteEvent(eventId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('events')
    .delete()
    .eq('id', eventId)

  return { data, error }
}

export async function registerForEvent(userId: string, eventId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('event_registrations')
    .insert({
      user_id: userId,
      event_id: eventId,
      status: 'registered',
    })
    .select()

  return { data, error }
}

export async function unregisterFromEvent(userId: string, eventId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('event_registrations')
    .delete()
    .eq('user_id', userId)
    .eq('event_id', eventId)

  return { data, error }
}

export async function getUserEventRegistrations(userId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('event_registrations')
    .select(`
      id,
      event_id,
      event:events(
        id,
        title,
        description,
        category,
        event_date,
        event_end_date,
        location_name,
        thumbnail,
        capacity,
        registered_count,
        ticket_price,
        is_free,
        status,
        created_by
      )
    `)
    .eq('user_id', userId)
    .eq('status', 'registered')
    .order('created_at', { ascending: false })

  return { data, error }
}

// ============================================================
// BLOG OPERATIONS
// ============================================================

export async function getBlogPosts(limit = 20, offset = 0) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('blog_posts')
    .select(`
      id,
      title,
      slug,
      excerpt,
      thumbnail,
      category,
      tags,
      views_count,
      likes_count,
      comments_count,
      published_at,
      created_at,
      author_id,
      author:users(
        id,
        display_name,
        profile_picture,
        bio
      )
    `)
    .eq('is_published', true)
    .order('published_at', { ascending: false })
    .range(offset, offset + limit - 1)

  return { data, error }
}

export async function getBlogPost(slug: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('blog_posts')
    .select(`
      id,
      title,
      slug,
      content,
      excerpt,
      thumbnail,
      category,
      tags,
      views_count,
      likes_count,
      comments_count,
      published_at,
      created_at,
      author_id,
      author:users(
        id,
        display_name,
        profile_picture,
        bio
      )
    `)
    .eq('slug', slug)
    .eq('is_published', true)
    .single()

  return { data, error }
}

export async function getBlogPostBySlug(slug: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('blog_posts')
    .select(`
      id,
      title,
      slug,
      content,
      excerpt,
      thumbnail,
      category,
      tags,
      views_count,
      likes_count,
      comments_count,
      published_at,
      created_at,
      author_id,
      author:users(
        id,
        display_name,
        profile_picture,
        bio
      )
    `)
    .eq('slug', slug)
    .eq('is_published', true)
    .single()

  return { data, error }
}

export async function getUserBlogPosts(userId: string, limit = 20, offset = 0) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('author_id', userId)
    .order('published_at', { ascending: false })
    .range(offset, offset + limit - 1)

  return { data, error }
}

export async function createBlogPost(
  userId: string,
  post: {
    title: string
    slug: string
    excerpt: string
    content: string
    thumbnail?: string
    category: string
    tags?: string[]
    is_published?: boolean
  }
) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('blog_posts')
    .insert({
      author_id: userId,
      ...post,
      is_published: post.is_published ?? false,
    })
    .select()

  return { data, error }
}

export async function updateBlogPost(postId: string, updates: any) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('blog_posts')
    .update(updates)
    .eq('id', postId)
    .select()
    .single()

  return { data, error }
}

export async function deleteBlogPost(postId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('blog_posts')
    .delete()
    .eq('id', postId)

  return { data, error }
}

export async function getBlogComments(postId: string, limit = 20, offset = 0) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('blog_comments')
    .select(`
      id,
      content,
      likes_count,
      created_at,
      author:users(
        id,
        display_name,
        profile_picture
      )
    `)
    .eq('post_id', postId)
    .eq('parent_id', null)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  return { data, error }
}

export async function createBlogComment(
  postId: string,
  userId: string,
  content: string,
  parentId?: string
) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('blog_comments')
    .insert({
      post_id: postId,
      author_id: userId,
      content,
      parent_id: parentId || null,
    })
    .select()

  return { data, error }
}

// ============================================================
// MARKETPLACE OPERATIONS
// ============================================================

export async function getMarketplaceProducts(limit = 20, offset = 0, category?: string) {
  const supabase = createClient()
  let query = supabase
    .from('marketplace_products')
    .select(`
      id,
      title,
      description,
      category,
      price,
      currency,
      media,
      is_featured,
      views_count,
      location_name,
      tags,
      condition,
      status,
      created_at,
      user_id,
      seller:users(
        id,
        display_name,
        profile_picture
      )
    `)
    .eq('status', 'active')

  if (category) {
    query = query.eq('category', category)
  }

  const { data, error } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  return { data, error }
}

export async function getMarketplaceProductById(productId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('marketplace_products')
    .select(`
      id,
      title,
      description,
      category,
      price,
      currency,
      media,
      is_featured,
      views_count,
      location_name,
      tags,
      condition,
      status,
      created_at,
      user_id,
      seller:users(
        id,
        display_name,
        profile_picture
      )
    `)
    .eq('id', productId)
    .single()

  return { data, error }
}

export async function getUserMarketplaceProducts(userId: string, limit = 20, offset = 0) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('marketplace_products')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  return { data, error }
}

export async function createMarketplaceProduct(
  userId: string,
  product: {
    title: string
    description: string
    category: string
    price: number
    currency?: string
    media?: any[]
    location_name?: string
    tags?: string[]
    condition?: string
  }
) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('marketplace_products')
    .insert({
      user_id: userId,
      ...product,
      status: 'active',
      currency: product.currency || 'USD',
    })
    .select()

  return { data, error }
}

export async function updateMarketplaceProduct(productId: string, updates: any) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('marketplace_products')
    .update(updates)
    .eq('id', productId)
    .select()
    .single()

  return { data, error }
}

export async function deleteMarketplaceProduct(productId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('marketplace_products')
    .delete()
    .eq('id', productId)

  return { data, error }
}

export async function getMarketplaceProductInquiries(userId: string, limit = 20, offset = 0) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('marketplace_inquiries')
    .select(`
      id,
      message,
      status,
      created_at,
      buyer:users(id, display_name, profile_picture),
      product:marketplace_products(id, title, price)
    `)
    .eq('seller_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  return { data, error }
}

export async function createMarketplaceInquiry(
  buyerId: string,
  sellerId: string,
  productId: string,
  message: string
) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('marketplace_inquiries')
    .insert({
      buyer_id: buyerId,
      seller_id: sellerId,
      product_id: productId,
      message,
      status: 'pending',
    })
    .select()

  return { data, error }
}

// ============================================================
// USER OPERATIONS
// ============================================================

export async function getUserProfile(userId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('users')
    .select(`
      id,
      email,
      full_name,
      display_name,
      bio,
      profile_picture,
      cover_picture,
      gender,
      country,
      city,
      interests,
      followers_count,
      following_count,
      coins_balance,
      is_premium,
      is_verified,
      created_at
    `)
    .eq('id', userId)
    .single()

  return { data, error }
}

export async function updateUserProfile(userId: string, updates: any) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('users')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select()
    .single()

  return { data, error }
}

export async function searchUsers(query: string, limit = 20) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('users')
    .select(`
      id,
      display_name,
      profile_picture,
      bio,
      country,
      is_premium,
      is_verified,
      followers_count
    `)
    .or(`display_name.ilike.%${query}%,full_name.ilike.%${query}%`)
    .eq('is_active', true)
    .limit(limit)

  return { data, error }
}

// ============================================================
// FOLLOWERS OPERATIONS
// ============================================================

export async function getFollowers(userId: string, limit = 20, offset = 0) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('follows')
    .select(`
      id,
      follower:users!follows_follower_id_fkey(
        id,
        display_name,
        profile_picture,
        bio,
        is_premium,
        is_verified
      )
    `)
    .eq('following_id', userId)
    .range(offset, offset + limit - 1)

  return { data, error }
}

export async function getFollowing(userId: string, limit = 20, offset = 0) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('follows')
    .select(`
      id,
      following:users!follows_following_id_fkey(
        id,
        display_name,
        profile_picture,
        bio,
        is_premium,
        is_verified
      )
    `)
    .eq('follower_id', userId)
    .range(offset, offset + limit - 1)

  return { data, error }
}

export async function followUser(followerId: string, followingId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('follows')
    .insert({
      follower_id: followerId,
      following_id: followingId,
    })
    .select()

  return { data, error }
}

export async function unfollowUser(followerId: string, followingId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('follows')
    .delete()
    .eq('follower_id', followerId)
    .eq('following_id', followingId)

  return { data, error }
}

// ============================================================
// NOTIFICATIONS OPERATIONS
// ============================================================

export async function getNotifications(userId: string, limit = 20, offset = 0) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('notifications')
    .select(`
      id,
      type,
      title,
      message,
      is_read,
      action_url,
      created_at,
      actor:users(
        id,
        display_name,
        profile_picture
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  return { data, error }
}

export async function markNotificationAsRead(notificationId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('notifications')
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq('id', notificationId)

  return { data, error }
}

export async function getUnreadNotificationCount(userId: string) {
  const supabase = createClient()
  const { data, error, count } = await supabase
    .from('notifications')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .eq('is_read', false)

  return { count, error }
}

// ============================================================
// BILLING & WALLET OPERATIONS
// ============================================================

export async function getCoinsTransactions(userId: string, limit = 20, offset = 0) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('coin_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  return { data, error }
}

export async function getCoinsBalance(userId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('users')
    .select('coins_balance')
    .eq('id', userId)
    .single()

  return { data: data?.coins_balance || 0, error }
}

export async function createCoinTransaction(
  userId: string,
  amount: number,
  transactionType: string,
  description?: string,
  referenceId?: string,
  referenceType?: string
) {
  const supabase = createClient()
  
  // Get current balance
  const { data: user } = await supabase
    .from('users')
    .select('coins_balance')
    .eq('id', userId)
    .single()

  const balanceAfter = (user?.coins_balance || 0) + amount

  const { data, error } = await supabase
    .from('coin_transactions')
    .insert({
      user_id: userId,
      amount,
      transaction_type: transactionType,
      description,
      reference_id: referenceId,
      reference_type: referenceType,
      balance_after: balanceAfter,
    })
    .select()

  if (!error) {
    // Update user's coins balance
    await supabase
      .from('users')
      .update({ coins_balance: balanceAfter })
      .eq('id', userId)
  }

  return { data, error }
}

export async function createTopupRequest(
  userId: string,
  amount: number,
  coinsAmount: number,
  paymentMethod: string
) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('account_topups')
    .insert({
      user_id: userId,
      amount,
      coins_amount: coinsAmount,
      payment_method: paymentMethod,
      status: 'pending',
    })
    .select()

  return { data, error }
}

// ============================================================
// PREMIUM SUBSCRIPTION OPERATIONS
// ============================================================

export async function createPremiumSubscription(
  userId: string,
  plan: string,
  amount: number
) {
  const supabase = createClient()
  
  // Calculate expiry date (1 month from now)
  const expiresAt = new Date()
  expiresAt.setMonth(expiresAt.getMonth() + 1)

  const { data, error } = await supabase
    .from('premium_subscriptions')
    .insert({
      user_id: userId,
      plan,
      amount,
      status: 'active',
      expires_at: expiresAt.toISOString(),
      auto_renew: true,
    })
    .select()

  if (!error) {
    // Update user's premium status
    await supabase
      .from('users')
      .update({ is_premium: true })
      .eq('id', userId)
  }

  return { data, error }
}

export async function getUserPremiumSubscription(userId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('premium_subscriptions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  return { data, error }
}

export async function updatePremiumSubscription(subscriptionId: string, updates: any) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('premium_subscriptions')
    .update(updates)
    .eq('id', subscriptionId)
    .select()
    .single()

  return { data, error }
}

export async function getAccountTopups(userId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('account_topups')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  return { data, error }
}

export async function createAccountTopup(
  userId: string,
  amount: number,
  coins: number,
  paymentMethod: string
) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('account_topups')
    .insert({
      user_id: userId,
      amount,
      coins_amount: coins,
      payment_method: paymentMethod,
      status: 'completed',
    })
    .select()
    .single()

  return { data, error }
}

export async function updateAccountTopupStatus(topupId: string, status: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('account_topups')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', topupId)
    .select()
    .single()

  return { data, error }
}

// ============================================================
// CONTENT REQUEST OPERATIONS
// ============================================================

export async function createContentRequest(
  userId: string,
  requestType: string,
  title: string,
  description?: string,
  details?: any
) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('content_requests')
    .insert({
      user_id: userId,
      request_type: requestType,
      title,
      description,
      details,
      status: 'pending',
    })
    .select()

  return { data, error }
}

export async function getUserContentRequests(userId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('content_requests')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  return { data, error }
}

export async function getContentRequests(status?: string) {
  const supabase = createClient()
  let query = supabase
    .from('content_requests')
    .select(`
      id,
      title,
      description,
      request_type,
      category,
      status,
      created_at,
      user:users(id, display_name, profile_picture)
    `)
    .order('created_at', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query
  return { data, error }
}

export async function updateContentRequestStatus(requestId: string, status: string, adminNotes?: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('content_requests')
    .update({
      status,
      admin_notes: adminNotes || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', requestId)
    .select()
    .single()

  return { data, error }
}

// ============================================================
// SETTINGS OPERATIONS
// ============================================================

export async function getNotificationPreferences(userId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', userId)
    .single()

  return { data, error }
}

export async function updateNotificationPreferences(userId: string, preferences: any) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('notification_preferences')
    .upsert({ user_id: userId, ...preferences, updated_at: new Date().toISOString() })
    .select()
    .single()

  return { data, error }
}

export async function getSecuritySettings(userId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('security_settings')
    .select('*')
    .eq('user_id', userId)
    .single()

  return { data, error }
}

export async function updateSecuritySettings(userId: string, settings: any) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('security_settings')
    .upsert({ user_id: userId, ...settings, updated_at: new Date().toISOString() })
    .select()
    .single()

  return { data, error }
}

export async function getPrivacySettings(userId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('privacy_settings')
    .select('*')
    .eq('user_id', userId)
    .single()

  return { data, error }
}

export async function updatePrivacySettings(userId: string, settings: any) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('privacy_settings')
    .upsert({ user_id: userId, ...settings, updated_at: new Date().toISOString() })
    .select()
    .single()

  return { data, error }
}
