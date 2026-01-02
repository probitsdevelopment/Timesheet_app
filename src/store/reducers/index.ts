import { combineReducers } from '@reduxjs/toolkit';
import authReducer from './authReducer';
import projectReducer from './projectReducer';
import userReducer from './userReducer';
import sidebarReducer from './sidebarReducer';
import timesheetReducer from './timeSheetReducer';

const rootReducer = combineReducers({
  auth: authReducer,
  projects: projectReducer,
  users: userReducer,
  sidebar: sidebarReducer,
  timesheet: timesheetReducer,
});

export default rootReducer;
