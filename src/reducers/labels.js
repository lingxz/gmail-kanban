import { Record, List, fromJS } from 'immutable';

import {
  MOVE_CARD,
  MOVE_LIST,
  TOGGLE_DRAGGING,
  UPDATE_HISTORY_ID,
  LIST_ALL_LABELS_REQUEST,
  LIST_ALL_LABELS_SUCCESS,
  LIST_ALL_LABELS_FAILURE,
} from '../constants';


const initialState = fromJS({
  allLabels: [],
  isFetching: false,
  isDragging: false,
  labelsToShow: ['INBOX', 'Label_203'],
})
/* eslint-enable new-cap */
// const initialState = new InitialState;
export default function labels(state = initialState, action) {
  switch (action.type) {
    case LIST_ALL_LABELS_REQUEST:
      return state;
    case LIST_ALL_LABELS_SUCCESS:
      return state.set('allLabels', fromJS(action.labels));
    case LIST_ALL_LABELS_FAILURE:
      return state;
    case UPDATE_HISTORY_ID: {
      const currentHistoryId = state.toJS().latestHistoryId || '';
      if (action.latestHistoryId > currentHistoryId) {
        return state.set('latestHistoryId', action.latestHistoryId)
      } else {
        return state;
      }
    }
    case MOVE_LIST: {
      const newLabelsToShow = [...state.toJS().labelsToShow];
      const { lastX, nextX } = action;
      const t = newLabelsToShow.splice(lastX, 1)[0];

      newLabelsToShow.splice(nextX, 0, t);

      return state.withMutations((ctx) => {
        ctx.set('labelsToShow', fromJS(newLabelsToShow));
      });
    }
    case TOGGLE_DRAGGING: {
      return state.set('isDragging', action.isDragging);
    }
    default:
      return state;
  }
}

