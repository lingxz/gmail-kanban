import { fromJS, Map } from 'immutable';
import {
  CLEAR_MAILBOX,
  SYNC_MAILBOX_LABEL_START,
  SYNC_MAILBOX_LABEL_SUCCESS,
  SYNC_MAILBOX_LABEL_FAILURE,
  SYNC_MAILBOX_LABEL_SUCCESS_NO_CHANGE,
  SYNC_MAILBOX_LATEST_UNREAD_THREADS,
  GET_MAILBOX_LABEL_INFO_START,
  GET_MAILBOX_LABEL_INFO_SUCCESS,
  GET_MAILBOX_LABEL_INFO_FAILURE,
  PARTIAL_SYNC_MAILBOX_REQUEST,
  PARTIAL_SYNC_MAILBOX_SUCCESS,
  PARTIAL_SYNC_MAILBOX_FAILURE,
  MOVE_CARD,
} from '../constants';

function getInsertIndexByDate(array, date) {
    var low = 0,
        high = array.length;

    while (low < high) {
        var mid = (low + high) >>> 1;
        if (array[mid].date > date) { low = mid + 1; }
        else { high = mid; }
    }
    return low;
}

function findAndRemoveInLabel(removedMessage, label) {
  // find the thread that message belongs to
  const threadIndex = label.threads.findIndex(item => item.id === removedMessage.threadId);
  if (threadIndex === -1) {
    // does not belong to any thread in label: label not affected, return label
    return label;
  }
  const thread = label.threads[threadIndex];
  let indexToRemoveFrom = -1;
  // find message in thread to remove it
  for (var i = 0; i < thread.emails.length; i++) {
    let email = thread.emails[i];
    if (email.id === removedMessage.id) {
      indexToRemoveFrom = i; // this is the index of the email in the thread's list of emails
      break
    }
  }

  // message not in the thread: label not affected, return label
  if (indexToRemoveFrom === -1) { return label; }

  // if the message in thread, delete message from thread
  thread.emails.splice(indexToRemoveFrom, 1);

  // if there are no messages remaining in thread, delete thread;
  if (thread.emails.length === 0) {
    label.threads.splice(threadIndex, 1);
    return label;
  } else {
    // update thread unread flag
    // if the message removed is read, no effect on the unread label of the thread
    if (removedMessage.labelIds.indexOf('UNREAD') > -1) {
      // only need to update flag if message removed is unread
      thread.unread = checkThreadUnread(thread);
    }
    label.threads[threadIndex] = thread;
    return label;
  }
}

function findAndUpdateInLabel(changedMessage, label) {
  const threadId = changedMessage.threadId;
  const threadIndex = label.threads.findIndex(item => item.id === changedMessage.threadId);
  if (threadIndex === -1) {
    // thread doesn't exist, create new thread for message
    // find insertion index
    const insertionIndex = getInsertIndexByDate(label.threads, changedMessage.date);
    const newThread = {
      id: changedMessage.threadId,
      emails: [changedMessage],
      historyId: changedMessage.historyId,
      date: changedMessage.date,
      to: changedMessage.to,
      from: changedMessage.from,
      snippet: changedMessage.snippet,
      content: changedMessage.content,
      subject: changedMessage.subject,
      labelIds: changedMessage.labelIds,
      unread: changedMessage.labelIds.indexOf('UNREAD') > -1 ? true: false,
    }
    label.threads.splice(insertionIndex, 0, newThread)
    return label;
  }

  const relevantThread = label.threads[threadIndex];
  const index = relevantThread.emails.findIndex(item => item.id === changedMessage.id)
  if (index === -1) {
    // not in current messages, add to message
    const insertionIndex = getInsertIndexByDate(relevantThread.emails, changedMessage.date)
    relevantThread.emails.splice(insertionIndex, 0, changedMessage)
  } else {
    // message already inside, just change
    relevantThread.emails[index] = changedMessage;
  }

  if (changedMessage.labelIds.indexOf('UNREAD') > -1) {
    relevantThread.unread = true;
  } else {
    if (relevantThread.unread) {
      // check if thread is still overall unread, and update accordingly
      relevantThread.unread = checkThreadUnread(relevantThread);
    }
  }
  label.threads[threadIndex] = relevantThread;
  return label;
}

function checkThreadUnread(thread) {
  let unread = false;
  for (var i = 0; i < thread.emails.length; i++) {
    if (thread.emails[i].labelIds.indexOf('UNREAD') > -1) {
      unread = true;
      break;
    }
  }
  return unread;
}

const initialState = new Map();

export default function mailbox(state = initialState, action) {
  switch (action.type) {
    case MOVE_CARD: {
      const { lastLabelId, nextLabelId, lastY } = action;
      if (lastLabelId === nextLabelId) {
        return state;
      } else {
        const lastLabel = state.toJS()[lastLabelId];
        const nextLabel = state.toJS()[nextLabelId];

        const nextLane = nextLabel.threads;
        const lastLane = lastLabel.threads;

        // move element to new place
        const insertionIndex = getInsertIndexByDate(nextLane, lastLane[lastY].date);
        const threadToMove = lastLane[lastY];

        // remove label from element and add new one
        const threadLabels = threadToMove.labelIds
        const index = threadLabels.indexOf(lastLabelId)
        if (index > -1) {
          threadLabels.splice(index, 1)
        }
        threadLabels.push(nextLabelId);
        threadToMove.labelIds = threadLabels;

        //TODO: need to remove and add label to each email as well

        nextLane.splice(insertionIndex, 0, threadToMove)
        //delete element from old place
        lastLane.splice(lastY, 1);
        return state.withMutations((ctx) => {
          ctx.setIn([lastLabelId, 'threads'], fromJS(lastLane))
          ctx.setIn([lastLabelId, 'messagesTotal'], lastLabel.messagesTotal - 1)
          ctx.setIn([nextLabelId, 'threads'], fromJS(nextLane))
          ctx.setIn([nextLabelId, 'messagesTotal'], nextLabel.messagesTotal + 1)
        })
      }
    }
    case SYNC_MAILBOX_LABEL_START:
      return state.setIn([action.labelId, 'isFetching'], true)
    case SYNC_MAILBOX_LABEL_FAILURE:
      return state.setIn([action.labelId, 'isFetching'], false)
    case SYNC_MAILBOX_LABEL_SUCCESS: {
      if (!action.threads) {
        return state.withMutations((ctx) => {
          ctx.setIn([action.labelId, 'isFetching'], false)
        })
      }

      if (action.latestUnreadThreads) {
        return state.withMutations((ctx) =>  {
          ctx.setIn([action.labelId, 'isFetching'], false)
          ctx.setIn([action.labelId, 'threads'], fromJS(action.threads))
          ctx.setIn([action.labelId, 'latestUnreadThreads'], fromJS(action.latestUnreadThreads))
        })
      }
      return state.withMutations((ctx) =>  {
        ctx.setIn([action.labelId, 'isFetching'], false)
        ctx.setIn([action.labelId, 'threads'], fromJS(action.threads))
      })
    }
    case SYNC_MAILBOX_LABEL_SUCCESS_NO_CHANGE:
      return state.setIn([action.labelId, 'isFetching'], false)
    case SYNC_MAILBOX_LATEST_UNREAD_THREADS: {
      // const changedThreadIds = action.threads.map(item => item.id)
      const currentThreadList = state.get(action.labelId).get('threads');

      let newThreadList = currentThreadList;
      for (var i = 0; i < action.threads.length; i++) {
        let changedThread = action.threads[i];
        let changedIndex = newThreadList.findIndex((item) => {
          return item.get('id') === changedThread.id;
        })
        newThreadList = newThreadList.update(changedIndex, item => fromJS(changedThread))
      }

      return state.withMutations((ctx) => {
        ctx.setIn([action.labelId, 'latestUnreadThreads'], action.threads)
        ctx.setIn([action.labelId, 'threads'], newThreadList)
      })
    }
    case GET_MAILBOX_LABEL_INFO_START:
      return state.setIn([action.labelId, 'isFetching'], true)
    case GET_MAILBOX_LABEL_INFO_FAILURE:
      return state.setIn([action.labelId, 'isFetching'], false)
    case GET_MAILBOX_LABEL_INFO_SUCCESS: {
      if (!action.payload) {
        return state.setIn([action.labelId, 'isFetching'], false)
      }
      if (action.payload.latestUnreadThreads) {
        return state.withMutations((ctx) => {
          ctx.setIn([action.labelId, 'id'], action.payload.id)
            .setIn([action.labelId, 'name'], action.payload.name)
            .setIn([action.labelId, 'type'], action.payload.type)
            .setIn([action.labelId, 'messagesTotal'], action.payload.messagesTotal)
            .setIn([action.labelId, 'messagesUnread'], action.payload.messagesUnread)
            .setIn([action.labelId, 'threadsTotal'], action.payload.threadsTotal)
            .setIn([action.labelId, 'threadsUnread'], action.payload.threadsUnread)
            .setIn([action.labelId, 'isFetching'], false)
            .setIn([action.labelId, 'latestUnreadThreads'], action.payload.latestUnreadThreads)
        });
      }
      return state.withMutations((ctx) => {
        ctx.setIn([action.labelId, 'id'], action.payload.id)
          .setIn([action.labelId, 'name'], action.payload.name)
          .setIn([action.labelId, 'type'], action.payload.type)
          .setIn([action.labelId, 'messagesTotal'], action.payload.messagesTotal)
          .setIn([action.labelId, 'messagesUnread'], action.payload.messagesUnread)
          .setIn([action.labelId, 'threadsTotal'], action.payload.threadsTotal)
          .setIn([action.labelId, 'threadsUnread'], action.payload.threadsUnread)
          .setIn([action.labelId, 'isFetching'], false)
      });
    }
    case PARTIAL_SYNC_MAILBOX_REQUEST:
      return state;
    case PARTIAL_SYNC_MAILBOX_SUCCESS: {
      if (!action.changed) {
        return state;
      }
      const jsState = state.toJS();
      const labelIds = Object.keys(jsState);
      // update changed messages
      for (var i = 0; i < action.messagesChanged.length; i++) {
        let changedMessage = action.messagesChanged[i];
        for (var idx = 0; idx < labelIds.length; idx++) {
          let labelId = labelIds[idx];
          if (changedMessage.labelIds.indexOf(labelId) > -1) {
            // find it in the relevant thread in the label and change it
            let newLabel = findAndUpdateInLabel(changedMessage, jsState[labelId]);
            jsState[labelId] = newLabel;
          }
        }
      }
      // update removed messages
      for (var i = 0; i < action.messagesRemovedFromLabels.length; i++) {
        let removedMessage = action.messagesRemovedFromLabels[i];
        for (var idx = 0; idx < labelIds.length; idx++) {
          let labelId = labelIds[idx];
          let newLabel = findAndRemoveInLabel(removedMessage, jsState[labelId])
          jsState[labelId] = newLabel;
        }
      }

      //TODO: if trash is one of the labels shown, then need to do something else
      // a message with trash should only appear in trash label and not in other labels, even if there are other labels present
      if (labelIds.indexOf('TRASH') === -1) {
        // if trash is not one of the labels to show, do the same thing as messagesRemovedFromLabels
        for (var i = 0; i < action.messagesTrashed.length; i++) {
          let trashedMessage = action.messagesTrashed[i];
          for (var idx = 0; idx < labelIds.length; idx++) {
            let labelId = labelIds[idx];
            let newLabel = findAndRemoveInLabel(trashedMessage, jsState[labelId])
            jsState[labelId] = newLabel;
          }
        }
      }

      // messages that are completely deleted (even in trash), same procedure as removedMessages
      for (var i = 0; i < action.messagesDeleted.length; i++) {
        let deletedMessage = action.messagesDeleted[i];
        for (var idx = 0; idx < labelIds.length; idx++) {
          let labelId = labelIds[idx];
          let newLabel = findAndRemoveInLabel(deletedMesage, jsState[labelId])
          jsState[labelId] = newLabel;
        }
      }

      return fromJS(jsState);
    }
    case PARTIAL_SYNC_MAILBOX_FAILURE:
      return state;
    default:
      return state;
  }
}

