import { select, race, take, takeEvery, takeLatest, call, put, all } from 'redux-saga/effects';
import { delay } from 'redux-saga';
import { getUser, getLabelIds } from './selectors';
import {
  FULL_SYNC_MAILBOX_REQUEST,
  FULL_SYNC_MAILBOX_FAILURE,
  GET_MAILBOX_LABEL_INFO_SUCCESS,
  SYNC_MAILBOX_LABEL_SUCCESS,
  USER_LOGIN,
  USER_LOGOUT,
  UPDATE_USER_CREDENTIALS,
  USER_LOGIN_FAILURE,
} from '../constants';

function* refreshAuth(user) {
  while (true) {
    yield call(delay, user.expiryTime - (new Date()).getTime() - 10 * 1000)
    let newUser = yield call(MailBoxActions.refreshAuth, user)
    yield put({ type: UPDATE_USER_CREDENTIALS, user: newUser })
  }
}

export function* watchAuth() {
  while (true) {
    try {
      yield take(USER_LOGIN);
      const user = yield select(getUser);
      yield race({
        logout: take(USER_LOGOUT),
        refreshToken: call(refreshAuth, user)
      })
      if (logout) {
        call(fetch, '/logout', { method: 'POST', redirect: 'follow', credentials: 'same-origin' })
      }
    } catch (error) {
      console.log(error);
      yield put({ type: USER_LOGIN_FAILURE });
    }
  }
}
