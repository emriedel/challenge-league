/**
 * Comment-related type definitions
 * 
 * These types define the structure of comments throughout the application,
 * from database models to UI components.
 */

import type { BaseUser } from './user';

/**
 * Base comment structure from database
 */
export interface BaseComment {
  id: string;
  text: string;
  createdAt: string;
  updatedAt: string;
  authorId: string;
  responseId: string;
}

/**
 * Comment with author information
 */
export interface Comment extends BaseComment {
  author: BaseUser;
}

/**
 * Comment for display in voting interface
 */
export interface VotingComment extends Comment {
  canEdit: boolean;
  isOwn: boolean;
}

/**
 * Comment for display in results view
 */
export interface ResultsComment extends Comment {
  // Results comments show all information but no editing
}

/**
 * Data for creating a new comment
 */
export interface CommentCreate {
  text: string;
  responseId: string;
}

/**
 * Data for updating an existing comment
 */
export interface CommentUpdate {
  text: string;
}

/**
 * Comment with response context (for API responses)
 */
export interface CommentWithResponse extends Comment {
  response: {
    id: string;
    caption: string;
    user: {
      username: string;
    };
  };
}