import { connectDB } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import User from '@/models/User';
import Post from '@/models/Post';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const user = await getUserFromRequest(request);

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const post = await Post.findById(params.id);
    if (!post) {
      return Response.json({ error: 'Post not found' }, { status: 404 });
    }

    const userDoc = await User.findById(user._id);
    const isSaved = userDoc.savedPosts.includes(params.id);

    if (isSaved) {
      userDoc.savedPosts = userDoc.savedPosts.filter((id: any) => id.toString() !== params.id);
    } else {
      userDoc.savedPosts.push(params.id);
    }

    await userDoc.save();

    return Response.json({ isSaved: !isSaved });
  } catch (error) {
    console.error('Error saving post:', error);
    return Response.json({ error: 'Failed to save post' }, { status: 500 });
  }
}