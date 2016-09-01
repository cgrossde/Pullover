import store from '../services/Store'
import { push } from 'react-router-redux'

export function transitionTo(path) {
	store.dispatch(push(path))
}
