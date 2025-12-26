import { TripData, Member } from '../../data/mockData';

// ============== TYPES ==============
export interface TripState {
  step: number;
  copied: string | null;
  loading: boolean;
  error: string | null;
  trip: TripData;
  memberBudget: Member | null;
  inviteCode: string | null;
  history: string[];
}

export type TripAction =
  | { type: 'SET_STEP'; payload: number }
  | { type: 'SET_COPIED'; payload: string | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_TRIP'; payload: TripData }
  | { type: 'SET_MEMBER_BUDGET'; payload: Member | null }
  | { type: 'SET_INVITE_CODE'; payload: string | null }
  | { type: 'ADD_HISTORY'; payload: string }
  | { type: 'RESET_STATE' };

// ============== INITIAL STATE ==============
export const initialTripState: TripState = {
  step: 2,
  copied: null,
  loading: true,
  error: null,
  trip: {
    _id: "",
    tripCode: "",
    name: "",
    days: 0,
    detail: "",
    createdBy: "",
    createdAt: 0,
    isCompleted: false,
    members: [],
    voteOptions: [],
    selectedDate: null,
    voteResults: { provinces: [], dates: [] },
    dateRanges: [],
    dateVotes: [],
    provinceVotes: []
  },
  memberBudget: null,
  inviteCode: null,
  history: []
};

// ============== REDUCER ==============
export const tripReducer = (state: TripState, action: TripAction): TripState => {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, step: action.payload };
      
    case 'SET_COPIED':
      return { ...state, copied: action.payload };
      
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
      
    case 'SET_ERROR':
      return { ...state, error: action.payload };
      
    case 'SET_TRIP':
      return { ...state, trip: action.payload };
      
    case 'SET_MEMBER_BUDGET':
      return { ...state, memberBudget: action.payload };
      
    case 'SET_INVITE_CODE':
      return { ...state, inviteCode: action.payload };
      
    case 'ADD_HISTORY':
      return { ...state, history: [action.payload, ...state.history] };
      
    case 'RESET_STATE':
      return initialTripState;
      
    default:
      return state;
  }
};