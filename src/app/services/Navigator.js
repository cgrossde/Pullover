import store from '../services/Store'
import { routeActions } from 'react-router-redux'

export function transitionTo(path) {
	store.dispatch(routeActions.push(path))
}
