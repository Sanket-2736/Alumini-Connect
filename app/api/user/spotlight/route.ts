import { connectDB } from '@/lib/db';
import User from '@/models/User';

export async function GET() {
  try {
    await connectDB();

    // Get recently verified alumni
    const spotlight = await User.find(
      { verificationStatus: 'approved' },
      { fullName: 1, profilePicture: 1, currentRole: 1, university: 1, verificationStatus: 1 }
    )
      .sort({ verifiedAt: -1 })
      .limit(3);

    return Response.json(spotlight);
  } catch (error) {
    console.error('Error fetching spotlight users:', error);
    return Response.json({ error: 'Failed to fetch spotlight users' }, { status: 500 });
  }
}