import store from '../services/Store'
import { pushState } from 'redux-router'

export function transitionTo(path) {
	store.dispatch(pushState(null, path))
}