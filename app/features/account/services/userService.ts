import apiClient from "../../common/services/apiClient";
import { User } from "../../common/types/user";

export const updateUser = async (user: User, showLocation: boolean, showContactInfo: boolean, contactInfo: string) => {
    return apiClient
        .put('/user/' + user.id, {
        ...user,
        show_location: showLocation,
        show_contact_info: showContactInfo,
        contact_info: contactInfo,
        })
        .then(
        response => {
            if (response.status === 200 && response.data.status === 'success') {
            const returnedUser = response.data.data as User;
            return returnedUser;
            }
        },
        error => {
            throw new Error(error.message || error);
        },
        )
        .catch(error => {
        console.error('Failed to update profile:', error.message || error);
        });
    };
