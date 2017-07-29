/* eslint-disable import/prefer-default-export */
export const CARD_HEIGHT = 168;  // height of a single card(excluding marginBottom/paddingBottom)
export const CARD_MARGIN = 32;  // height of a marginBottom+paddingBottom
export const OFFSET_HEIGHT = 84; // height offset from the top of the page

export const USER_LOGOUT = 'USER_LOGOUT';
export const USER_LOGIN = 'USER_LOGIN';
export const USER_LOGIN_FAILURE = 'USER_LOGIN_FAILURE';
export const UPDATE_USER_CREDENTIALS = 'UPDATE_USER_CREDENTIALS';

export const FULL_SYNC_MAILBOX_REQUEST = 'FULL_SYNC_MAILBOX_REQUEST';
export const FULL_SYNC_MAILBOX_FAILURE = 'FULL_SYNC_MAILBOX_FAILURE';
export const PARTIAL_SYNC_MAILBOX_REQUEST = 'PARTIAL_SYNC_MAILBOX_REQUEST';
export const PARTIAL_SYNC_MAILBOX_SUCCESS = 'PARTIAL_SYNC_MAILBOX_SUCCESS';
export const PARTIAL_SYNC_MAILBOX_FAILURE = 'PARTIAL_SYNC_MAILBOX_FAILURE';
export const UPDATE_HISTORY_ID = 'UPDATE_HISTORY_ID';

export const SYNC_MAILBOX_LABEL_REQUEST = 'SYNC_MAILBOX_LABEL_REQUEST';
export const SYNC_MAILBOX_LABEL_SUCCESS = 'SYNC_MAILBOX_LABEL_SUCCESS';
export const SYNC_MAILBOX_LABEL_FAILURE = 'SYNC_MAILBOX_LABEL_FAILURE';

export const LIST_ALL_LABELS_REQUEST = 'LIST_ALL_LABELS_REQUEST';
export const LIST_ALL_LABELS_SUCCESS = 'LIST_ALL_LABELS_SUCCESS';
export const LIST_ALL_LABELS_FAILURE = 'LIST_ALL_LABELS_FAILURE';

export const GET_MAILBOX_LABEL_INFO_REQUEST = 'GET_MAILBOX_LABEL_INFO_REQUEST';
export const GET_MAILBOX_LABEL_INFO_SUCCESS = 'GET_MAILBOX_LABEL_INFO_SUCCESS';
export const GET_MAILBOX_LABEL_INFO_FAILURE = 'GET_MAILBOX_LABEL_INFO_FAILURE';

export const MOVE_CARD = 'MOVE_CARD';
export const MOVE_LIST = 'MOVE_LIST';
export const TOGGLE_DRAGGING = 'TOGGLE_DRAGGING';

export const GMAIL_UNREAD_SYNC_MS = 10 * 1000; // every 10 seconds
export const FETCH_ALL_MAILBOX_LABELS = 30 * 60 * 1000; // every 30 minutes

export const ADD_LABEL_TO_SHOW = 'ADD_LABEL_TO_SHOW';
export const UPDATE_LABELS_TO_SHOW = 'UPDATE_LABELS_TO_SHOW';
