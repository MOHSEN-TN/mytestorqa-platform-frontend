import { configureStore } from "@reduxjs/toolkit";
import projectReducer from "../slices/projectSlice";
import testCaseReducer from "../slices/testCaseSlice";
import testSuiteReducer from "../slices/testSuiteSlice";
import campaignReducer from "../slices/campaignSlice";
import iterationReducer from "../slices/iterationSlice";
import usersReducer from '@/lib/slices/userSlice';
import bugReducer from "@/lib/slices/bugSlice";
import reportReducer from "@/lib/slices/reportSlice";
export const store = configureStore({
  reducer: {
    projects: projectReducer,
    testSuites: testSuiteReducer,
    testCases: testCaseReducer,
    campaigns: campaignReducer,
    iterations: iterationReducer, 
    users: usersReducer,
    bugs: bugReducer,
    reports: reportReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;