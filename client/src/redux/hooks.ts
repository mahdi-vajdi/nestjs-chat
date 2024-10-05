import { TypedUseSelectorHook, useDispatch as ReduxUseDispatch, useSelector as ReduxUseSelector } from 'react-redux';
import type { RootState, AppDispatch } from './store';



export const useDispatch = ()=> ReduxUseDispatch<AppDispatch>();
export const useSelector : TypedUseSelectorHook<RootState> = ReduxUseSelector;