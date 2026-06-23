import { NextRequest } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import University from '@/models/University';
import { successResponse, errorResponse } from '@/lib/apiResponse';


export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return errorResponse('User not authenticated', 401);
    }

    await connectToDatabase();
    const currentUser = await User.findById(userId)
      .select('_id university department batch skills role')
      .lean();

    if (!currentUser) {
      return errorResponse('User not found', 404);
    }
    const connectedUsers = await User.findById(userId)
      .select('connections')
      .lean();

    const connectedIds = connectedUsers?.connections || [];
    const recommendations = await User.find({
      _id: { $ne: userId, $nin: connectedIds },
      verificationStatus: 'approved',
      isBanned: false,
    })
      .select('_id fullName email profilePicture university department batch skills role bio')
      .populate('university', 'name')
      .lean();
    const scoredRecommendations = recommendations.map((user: any) => {
      let score = 0;
      let matchReasons: string[] = [];
      if (user.university?._id?.toString() === currentUser.university?.toString()) {
        score += 50;
        matchReasons.push('Same University');
      }
      if (user.batch === currentUser.batch) {
        score += 30;
        matchReasons.push('Same Batch');
      }
      if (user.department === currentUser.department) {
        score += 25;
        matchReasons.push('Same Department');
      }
      const sharedSkills = (user.skills || []).filter((skill: string) =>
        (currentUser.skills || []).includes(skill)
      );
      if (sharedSkills.length > 0) {
        score += sharedSkills.length * 5;
        matchReasons.push(`${sharedSkills.length} shared skill${sharedSkills.length > 1 ? 's' : ''}`);
      }
      if (user.role !== currentUser.role) {
        score += 10;
        matchReasons.push(`${user.role === 'alumni' ? 'Alumni' : 'Student'}`);
      }

      return {
        userId: user._id.toString(),
        fullName: user.fullName,
        email: user.email,
        profilePicture: user.profilePicture,
        university: user.university?.name || 'Unknown',
        department: user.department,
        batch: user.batch,
        role: user.role,
        bio: user.bio,
        skills: user.skills || [],
        score,
        matchReasons,
      };
    });
    const topRecommendations = scoredRecommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    return successResponse(topRecommendations, 'Recommendations fetched successfully');
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    return errorResponse('Failed to fetch recommendations', 500);
  }
}
