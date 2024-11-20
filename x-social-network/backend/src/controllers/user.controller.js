// Models
import User from '#models/user.model.js';
import Notification from '#models/norification.model.js';

export const getUserProfile = async (req, res) => {
    const { userName }  = req.params;

    try {
        const user = await User.findOne({ userName }).select("-password");
        if(!user) return res.status(404).json({ message: 'User not found' })

        res.status(200).json(user);
    } catch (error) {
        console.log('Error in getUserProfile: ', error.message);
        res.status(500).json({ error: error.message });
    }
}

export const followUnfollowUser = async (req, res) => {
    try {
        const { id } = req.params;
        const userToModify = await User.findById(id);
        if (!req.user || !req.user._id) {
            return res.status(401).json({ error: "Unauthorized: user data not found" });
        }
        const currentUser = await User.findById(req.user['_id']);

        if (id === req.user['_id'].toString()) return res.status(400).json({ error: "You can't follow/unfollow yourself" });
        if(!userToModify || !currentUser) return res.status(404).json({ error: "User not found" });

        const isFollowing = currentUser.followings.includes(id);

        if(isFollowing) {
            await User.findByIdAndUpdate(id, {
                $pull: {
                    followers: req.user['_id']
                }
            });
            await User.findByIdAndUpdate(req.user['_id'], {
                $pull: {
                    followings: id
                }
            });
            res.status(200).json({
                message: "User unfollowed successfully"
            })
        } else {
            await User.findByIdAndUpdate(id, {
                $push: {
                    followers: req.user['_id']
                }
            });

            await User.findByIdAndUpdate(req.user['_id'], {
                $push: {
                    followings: id
                }
            });

            const newNotification = new Notification({
                type: 'follow',
                from: req.user['_id'],
                to: userToModify['_id']
            });

            await newNotification.save();

            res.status(200).json({
                message: "User followed successfully"
            })
        }

    } catch (error) {
        console.log('Error in followUnfollowUser: ', error.message);
        res.status(500).json({ error: error.message });
    }
}