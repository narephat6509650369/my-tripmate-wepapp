import type { Request, Response } from "express";
import notiservice from "../services/notiService.js";

export const getUserNotiController = async (req: Request, res: Response) => {
    try {
        const user_id = req.user?.user_id;

        if (!user_id) {
            return res.status(401).json({
                success: false,
                code: "AUTH_UNAUTHORIZED",
                message: "Unauthorized"
            });
        }

        const result = await notiservice.getUserNotifications(user_id);
        console.log("getUserNotiController", result)

        if (!result.success) {
            return res.status(500).json({
                success: false,
                code: "NOTI_FETCH_FAILED",
                message: result.message || "Failed to retrieve notifications",
                data: {
                    notifications: []
                }
            });
        }

        return res.status(200).json({
            success: true,
            code: "NOTI_FETCH_SUCCESS",
            message: "Notifications retrieved successfully",
            data: result
        });

    }catch (err) {
        console.error("Error getting user notifications:", err instanceof Error ? err.message : err);
        return res.status(500).json({
            success: false,
            code: "NOTI_FETCH_ERROR",
            message: err instanceof Error ? err.message : "An error occurred while retrieving user notifications",
            error: {
                detail: err instanceof Error ? err.message : "Unknown error"
            }
        });
    }
};

export const markNotificationAsReadController = async (req: Request,res: Response) => {
  try {
    const user_id = req.user?.user_id;
    const notificationId = req.params.id;

    if (!user_id) {
      return res.status(401).json({
        success: false,
        code: "AUTH_UNAUTHORIZED",
        message: "Unauthorized"
      });
    }

    if (!notificationId) {
      return res.status(400).json({
        success: false,
        code: "NOTI_ID_REQUIRED",
        message: "Notification ID is required"
      });
    }

    const result = await notiservice.markNotificationAsRead(
      notificationId
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        code: "NOTI_MARK_FAILED",
        message: result.message
      });
    }

    return res.status(200).json({
      success: true,
      code: "NOTI_MARK_SUCCESS",
      message: "Notification marked as read"
    });

  } catch (err) {
    console.error("Error marking notification as read:", err);

    return res.status(500).json({
      success: false,
      code: "NOTI_MARK_ERROR",
      message: "Internal server error"
    });
  }
};

export const markAllNotificationAsReadController = async (req: Request,res: Response) => {
  try {
    const user_id = req.user?.user_id;

    if (!user_id) {
      return res.status(401).json({
        success: false,
        code: "AUTH_UNAUTHORIZED",
        message: "Unauthorized"
      });
    }

    const result = await notiservice.markNotificationAsRead(user_id);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        code: "NOTI_MARK_ALL_FAILED",
        message: result.message
      });
    }

    return res.status(200).json({
      success: true,
      code: "NOTI_MARK_ALL_SUCCESS",
      message: "All notifications marked as read"
    });

  } catch (err) {
    console.error("Error marking all notifications as read:", err);

    return res.status(500).json({
      success: false,
      code: "NOTI_MARK_ALL_ERROR",
      message: "Internal server error"
    });
  }
};


export const getUnreadCountController = async (req: Request,res: Response) => {
  try {
    const user_Id = req.user?.user_id;

    if (!user_Id) {
      return res.status(401).json({
        success: false,
        code: "AUTH_UNAUTHORIZED",
        message: "Unauthorized"
      });
    }

    const result = await notiservice.getUnreadCount(user_Id);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        code: "NOTI_COUNT_FAILED",
        message: result.message
      });
    }

    return res.status(200).json({
      success: true,
      code: "NOTI_COUNT_SUCCESS",
      message: "Unread count retrieved successfully",
      data: {
        unreadCount: result.count
      }
    });

  } catch (err) {
    console.error("Error getting unread count:", err);

    return res.status(500).json({
      success: false,
      code: "NOTI_COUNT_ERROR",
      message: "Internal server error"
    });
  }
};

export const deleteNotificationController = async (req: Request,res: Response) => {
  try {
    const user_id = req.user?.user_id;
    const notificationId = req.params.id;

    if (!user_id) {
      return res.status(401).json({
        success: false,
        code: "AUTH_UNAUTHORIZED",
        message: "Unauthorized"
      });
    }

    if (!notificationId) {
      return res.status(400).json({
        success: false,
        code: "NOTI_ID_REQUIRED",
        message: "Notification ID is required"
      });
    }

    const result = await notiservice.deleteNotification(notificationId,user_id);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        code: "NOTI_DELETE_FAILED",
        message: result.message
      });
    }

    return res.status(200).json({
      success: true,
      code: "NOTI_DELETE_SUCCESS",
      message: "Notification deleted successfully"
    });

  } catch (err) {
    console.error("Error deleting notification:", err);

    return res.status(500).json({
      success: false,
      code: "NOTI_DELETE_ERROR",
      message: "Internal server error"
    });
  }
};

