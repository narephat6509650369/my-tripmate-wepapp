import { pool } from "../config/db.js";
import crypto from "crypto";
/*
notification_id	varchar(36)	NO	PRI		
user_id	varchar(36)	NO	MUL		
trip_id	varchar(36)	YES	MUL		
notification_type	enum('trip_invitation','new_voting_session','voting_closed','trip_confirmed','member_joined','member_removed')	NO			
title	varchar(255)	NO			
message	text	YES			
is_read	tinyint(1)	YES	MUL	0	
created_at	timestamp	YES	MUL	CURRENT_TIMESTAMP	DEFAULT_GENERATED
read_at	timestamp	YES		
*/	

export const createNotification = async (trip_id: string,user_id: string,type: string,title: string,message: string) => {

  const connection = await pool.getConnection();

  try {
    const notification_id = crypto.randomUUID();

    await connection.query(
      `INSERT INTO notifications 
       (notification_id, user_id, trip_id, notification_type, title, message)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [notification_id, user_id, trip_id, type, title, message]
    );

    return {
      success: true,
      notification_id
    };

  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Error creating notification"
    };

  } finally {
    connection.release();
  }
};

export const getNotificationsByUserId = async (user_id: string) => {
    const connection = await pool.getConnection();
    try {
        const [rows] = await connection.query(
            `SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC`,
            [user_id]
        );

        return {
            success: true,
            notifications: rows
        };
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : "An error occurred while fetching notifications"
        };
    } finally {
        connection.release();
    }
};


export const markNotificationAsRead = async (notification_id: string) => {
    const connection = await pool.getConnection();
    try {
    
        await connection.query(`
            UPDATE notifications SET is_read = 1, read_at = CURRENT_TIMESTAMP WHERE notification_id = ?
        `, [notification_id]);
        connection.release();
        return {
            success: true,
            message: "Notification marked as read"
        };
    } catch (error) {        
        return {
            success: false,
            message: error instanceof Error ? error.message : "An error occurred while marking the notification as read"
        };
    }
};

export const markAllNotificationsAsReadForTrip = async (trip_id: string, user_id: string) => {
    const connection = await pool.getConnection();
    try {
        await connection.query(`
            UPDATE notifications SET is_read = 1, read_at = CURRENT_TIMESTAMP WHERE trip_id = ? AND user_id = ?
        `, [trip_id, user_id]);
        connection.release();
        return {
            success: true,
            message: "All notifications for the trip marked as read"
        };
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : "An error occurred while marking all notifications as read for the trip"
        };
    }   
};

export const deleteNotification = async (notification_id: string,user_id: string) => {

  const connection = await pool.getConnection();

  try {

    const [result]: any = await connection.query(
      `DELETE FROM notifications 
       WHERE notification_id = ? 
       AND user_id = ?`,
      [notification_id, user_id]
    );

    if (result.affectedRows === 0) {
      return {
        success: false,
        message: "Notification not found or not authorized"
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

  } finally {
    connection.release(); 
  }
};


export const countUnreadNotifications = async ( user_id: string) => {
    const connection = await pool.getConnection();
    try {
        const [rows] = await connection.query(`
            SELECT COUNT(*) AS unread_count FROM notifications WHERE user_id = ? AND trip_id = ? AND is_read = 0
        `, [user_id]);
        connection.release();
        const unreadCount = (rows as any[])[0].unread_count;
        return {
            success: true,
            unreadCount
        };
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : "An error occurred while counting unread notifications"
        };
    }   
};

export default {
    createNotification,
    getNotificationsByUserId,
    markNotificationAsRead,
    markAllNotificationsAsReadForTrip,
    deleteNotification,
    countUnreadNotifications
}