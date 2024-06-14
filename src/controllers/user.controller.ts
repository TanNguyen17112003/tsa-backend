import { User } from '../models/user';
import { UserType } from '../types/user';
async function createUser(body: UserType) {
    const user = new User(body);
    try {
        const newUser = await user.save();
        return {
            success: true,
            data: newUser
        };
    } catch (error) {
        return {
            success: false,
            message: error
        };
    }
}
export { createUser };
