import notiModel from "../models/notiModel.js";
import tripModel from "../models/tripModel.js";
import { sendEmail } from "./email.service.js";
import { tripConfirmedTemplate } from "../templates/emailTemplates.js";

/*
enum('trip_invitation','new_voting_session','voting_closed','trip_confirmed','member_joined','member_removed')
*/
export const notifyMemberJoined = async (trip_id: string,joinedUserId: string) => {
  try {
    const members = await tripModel.getTripMembersWithEmail(trip_id);

    const results = await Promise.all(
      members
        .filter(m => m.user_id !== joinedUserId)
        .map(m =>
          notiModel.createNotification(
            trip_id,
            m.user_id,
            'member_joined',
            'A new member has joined your trip',
            `User ${joinedUserId} joined trip ${trip_id}`
          )
        )

       
    );

    // เช็คว่ามีตัวไหน fail ไหม
    const failed = results.find(r => !r.success);

    if (failed) {
      return {
        success: false,
        message: failed.message
      };
    }

    return {
      success: true,
      message: "Notifications sent successfully"
    };

  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Error notifying member joined"
    };
  }
};


export const notifyTripConfirmed = async (trip_id: string) => {
  try {
    const members = await tripModel.getTripMembersWithEmail(trip_id);

    for (const m of members) {

      await notiModel.createNotification(
        trip_id,
        m.user_id,
        "trip_confirmed",
        "Trip confirmed ",
        "The trip owner has confirmed your trip successfully."
      );

      
      if (m.email) {
        await sendEmail(
          m.email,
          "TripMate",
          "The trip owner has confirmed your trip successfully.",
          tripConfirmedTemplate(m.full_name)
        );
      }
    }

    return { success: true };

  } catch (error) {
    return {
      success: false,
      message: error instanceof Error
        ? error.message
        : "Error notifying trip confirmed"
    };
  }
};

export const notifyTripArchived = async (trip_id: string) => {
  try {
    const members = await tripModel.getTripMembersWithEmail(trip_id);

    for (const m of members) {

      await notiModel.createNotification(
        trip_id,
        m.user_id,
        "trip_archived",
        "TripMate",
        "This trip has been archived because it was inactive for 7 days."
      );

      if (m.email) {
        await sendEmail(
          m.email,
          "Trip archived ",
          "This trip has been archived because it was inactive for 7 days.",
          tripConfirmedTemplate(m.full_name)
        );
      }
    }

    return { success: true };

  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Error notifying trip archived"
    };
  }
};

export const notifyTripCompleted = async (trip_id: string) => {
  try {
    const members = await tripModel.getTripMembersWithEmail(trip_id);

    for (const m of members) {

      await notiModel.createNotification(
        trip_id,
        m.user_id,
        "trip_completed",
        "Voting completed ",
        "All members have voted. The trip is now completed."
      );

      if (m.email) {
        await sendEmail(
          m.email,
          "TripMate",
          "All members have voted. The trip is now completed.",
          tripConfirmedTemplate(m.full_name)
        );
      }
    }

    return { success: true };

  } catch (error) {
    return {
      success: false,
      message: error instanceof Error
        ? error.message
        : "Error notifying trip completed"
    };
  }
};

export const getUserNotifications = async (user_id: string) => {
    try {
        const result = await notiModel.getNotificationsByUserId(user_id);
        console.log("results:",result);
        if (result.success) {
            return {
                success: true,
                notifications: result.notifications
            };
        } else {
            return {
                success: false,
                message: result.message || "Failed to retrieve notifications"
            };
        }   
    } catch (error) {
        console.error("Error getting user notifications:", error instanceof Error ? error.message : error);
        return {
            success: false,
            message: error instanceof Error ? error.message : "An error occurred while retrieving notifications"
        };
    }
};

export const markNotificationAsRead = async (notification_id: string) => {
    try {
        const result = await notiModel.markNotificationAsRead(notification_id);
        if (result.success) {
            return {
                success: true
            };
        } else {
            return {
                success: false,
                message: result.message || "Failed to mark notification as read"
            };
        }
    } catch (error) {        
        console.error("Error marking notification as read:", error instanceof Error ? error.message : error);
        return {
            success: false,
            message: error instanceof Error ? error.message : "An error occurred while marking notification as read"
        };
    }
};

export const getUnreadCount = async (user_id: string) => {
    try {
        const result = await notiModel.countUnreadNotifications(user_id);
        if (result.success) {
            return {
                success: true,
                count: result.unreadCount
            };
        } else {
            return {
                success: false,
                message: result.message || "Failed to retrieve unread count"
            };
        }
    } catch (error) {
        console.error("Error getting unread count:", error instanceof Error ? error.message : error);
        return {
            success: false,
            message: error instanceof Error ? error.message : "An error occurred while retrieving unread count"
        };
    }
};

export const deleteNotification = async (noti_Id: string,user_id: string) => {
  try {

    if (!noti_Id) {
      return {
        success: false,
        message: "Notification ID is required"
      };
    }

    if (!user_id) {
      return {
        success: false,
        message: "User ID is required"
      };
    }

    const result = await notiModel.deleteNotification(noti_Id,user_id);

    if (!result.success) {
      return {
        success: false,
        message: result.message
      };
    }

    return {
      success: true,
      message: "Notification deleted successfully"
    };

  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Error deleting notification"
    };
  }
};


export default {
    notifyMemberJoined,
    notifyTripConfirmed,
    notifyTripArchived,
    notifyTripCompleted,
    markNotificationAsRead,
    getUserNotifications,
    getUnreadCount,
    deleteNotification
};