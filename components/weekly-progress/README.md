# Weekly Progress Components

This module implements the web app's `ConsolidatedWeeklyProgressCard` functionality for React Native.

## Components

### `MoaiWeeklyProgress`

Enhanced weekly progress component that now supports showing all members' progress with week navigation.

#### Usage

```tsx
import { MoaiWeeklyProgress } from '@/components/moai/MoaiWeeklyProgress';
import { MemberActivityModal } from '@/components/modals/MemberActivityModal';

const [selectedMember, setSelectedMember] = useState(null);
const [selectedDate, setSelectedDate] = useState(null);
const [showModal, setShowModal] = useState(false);

// Personal progress view (original behavior)
<MoaiWeeklyProgress 
  moaiId={moaiId}
  onPress={() => {/* navigate to workout planning */}}
  onInfoPress={() => {/* show commitment info */}}
/>

// All members progress view (new functionality)
<MoaiWeeklyProgress 
  moaiId={moaiId}
  showAllMembers={true}
  onPress={() => {/* navigate to workout planning */}}
  onInfoPress={() => {/* show commitment info */}}
  onMemberDayPress={(memberId, day) => {
    // Find member data and show activity modal
    const member = getMemberById(memberId);
    setSelectedMember(member);
    setSelectedDate(day);
    setShowModal(true);
  }}
/>

<MemberActivityModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  member={selectedMember}
  selectedDate={selectedDate}
  activities={memberActivities}
/>
```

### `MemberProgressRow`

Displays a single member's weekly progress with avatar, commitment circles, and weekly progress grid.

### `WeeklyProgressCircles`

Shows the 7-day week view with day circles indicating activity completion.

### `MemberActivityModal`

Modal that shows detailed activity information for a specific member and day.

## Data Flow

1. `useMoaiAllMembersWeeklyProgress` hook fetches all members' progress data
2. Week navigation allows browsing different weeks
3. Day circle interactions trigger the activity modal
4. Real-time updates keep progress data current

## Features Implemented

✅ Data fetching for all members' weekly progress  
✅ Week navigation with previous/next buttons  
✅ Member progress rows with commitment circles  
✅ Weekly progress day circles  
✅ Interactive day selection modal  
✅ Responsive design matching web app  

## TODO: Future Enhancements

- [ ] Implement accountability buddy detection
- [ ] Add coach subscription indicators  
- [ ] Implement commitment streak tracking
- [ ] Add real activity data integration
- [ ] Add bulk fetch optimization for large moais