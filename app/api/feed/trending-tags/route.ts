import { connectDB } from '@/lib/db';
import Post from '@/models/Post';

export async function GET() {
  try {
    await connectDB();

    // Get trending tags from last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const tags = await Post.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo }, isArchived: false } },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    return Response.json(tags);
  } catch (error) {
    console.error('Error fetching trending tags:', error);
    return Response.json({ error: 'Failed to fetch trending tags' }, { status: 500 });
  }
}