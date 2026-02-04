// Learning Objective:
// This tutorial teaches you how to build a type-safe Finite State Machine (FSM) in TypeScript
// using discriminated unions. You will learn how to define different application states,
// model events that trigger state changes, and enforce valid transitions at compile-time,
// making your application logic more robust and easier to understand.

// --- 1. Define all possible state types for our FSM ---
// We use an enum to ensure that our state 'type' discriminators are consistent and refactorable.
enum StateType {
  Idle = "IDLE",
  Loading = "LOADING",
  Success = "SUCCESS",
  Error = "ERROR",
}

// --- 2. Define the structure for each individual state ---
// Each state will be an object with a 'type' property (the discriminator)
// and potentially other state-specific data.

// The FSM starts in an 'Idle' state, with no specific data.
interface IdleState {
  type: StateType.Idle;
}

// When loading, we might want to track what is being loaded (e.g., a data ID).
interface LoadingState {
  type: StateType.Loading;
  dataId: string;
}

// Upon success, we store the fetched data.
interface SuccessState {
  type: StateType.Success;
  data: string;
}

// In case of an error, we store the error message.
interface ErrorState {
  type: StateType.Error;
  message: string;
}

// --- 3. Create a Discriminated Union for our FSM's overall application state ---
// This is the core of our type-safe FSM. 'AppState' can be any one of the defined states.
// TypeScript can use the 'type' property (our discriminator) to narrow down which specific
// state interface we are currently dealing with, providing strong type checking.
type AppState = IdleState | LoadingState | SuccessState | ErrorState;

// --- 4. Define all possible events (actions) that can trigger state transitions ---
// Events are messages that tell the FSM to attempt a state change.
enum EventType {
  Load = "LOAD",
  Resolve = "RESOLVE", // Data successfully loaded
  Reject = "REJECT",   // Data failed to load
  Reset = "RESET",
}

// --- 5. Define the structure for each individual event ---
// Similar to states, events also have a 'type' discriminator and relevant data.

// The 'Load' event needs to know what data to load.
interface LoadEvent {
  type: EventType.Load;
  dataId: string;
}

// The 'Resolve' event carries the successfully loaded data.
interface ResolveEvent {
  type: EventType.Resolve;
  data: string;
}

// The 'Reject' event carries the error message.
interface RejectEvent {
  type: EventType.Reject;
  message: string;
}

// The 'Reset' event doesn't need any additional data.
interface ResetEvent {
  type: EventType.Reset;
}

// --- 6. Create a Discriminated Union for all possible events ---
// This allows our transition function to accept any valid event.
type AppEvent = LoadEvent | ResolveEvent | RejectEvent | ResetEvent;

// --- 7. Implement the core state transition function ---
// This function takes the current state and an event, and returns the new state.
// It enforces valid transitions based on the current state and the incoming event.
function transition(currentState: AppState, event: AppEvent): AppState {
  // Use a 'switch' statement on `currentState.type` to narrow down the current state.
  // This is where TypeScript's discriminated unions shine! Inside each 'case',
  // TypeScript knows exactly which specific state type `currentState` is.
  switch (currentState.type) {
    case StateType.Idle:
      // If we are Idle, we can only process a 'Load' event.
      switch (event.type) {
        case EventType.Load:
          console.log(`Transitioning from Idle to Loading for ID: ${event.dataId}`);
          return { type: StateType.Loading, dataId: event.dataId };
        default:
          // Any other event is invalid from the Idle state. We return the current state.
          console.warn(`Invalid event '${event.type}' for Idle state. Staying Idle.`);
          return currentState;
      }

    case StateType.Loading:
      // If we are Loading, we can either 'Resolve' or 'Reject'.
      // Note: TypeScript knows 'currentState' is `LoadingState` here.
      switch (event.type) {
        case EventType.Resolve:
          console.log(`Transitioning from Loading to Success with data: ${event.data}`);
          return { type: StateType.Success, data: event.data };
        case EventType.Reject:
          console.log(`Transitioning from Loading to Error: ${event.message}`);
          return { type: StateType.Error, message: event.message };
        default:
          // Other events are ignored or considered invalid while loading.
          console.warn(`Invalid event '${event.type}' for Loading state. Staying Loading.`);
          return currentState;
      }

    case StateType.Success:
      // From Success, we can only 'Reset' to go back to Idle.
      // TypeScript knows 'currentState' is `SuccessState` here.
      switch (event.type) {
        case EventType.Reset:
          console.log(`Transitioning from Success to Idle.`);
          return { type: StateType.Idle };
        default:
          console.warn(`Invalid event '${event.type}' for Success state. Staying Success.`);
          return currentState;
      }

    case StateType.Error:
      // From Error, we can only 'Reset' to go back to Idle.
      // TypeScript knows 'currentState' is `ErrorState` here.
      switch (event.type) {
        case EventType.Reset:
          console.log(`Transitioning from Error to Idle.`);
          return { type: StateType.Idle };
        default:
          console.warn(`Invalid event '${event.type}' for Error state. Staying Error.`);
          return currentState;
      }
    // This function returns an `AppState`, and thanks to discriminated unions,
    // TypeScript can ensure that all possible `currentState.type` values are handled,
    // or it would flag a potential unhandled case. This helps guarantee a valid
    // state is always returned.
  }
}

// --- 8. Example Usage: Demonstrate the FSM in action ---
console.log("--- FSM Simulation Start ---");

// Define the initial state of our FSM.
let currentState: AppState = { type: StateType.Idle };
console.log("Initial State:", currentState);

// Attempt a valid transition: Idle -> Loading
currentState = transition(currentState, { type: EventType.Load, dataId: "user-123" });
console.log("Current State after Load:", currentState);
// At this point, `currentState` is safely narrowed to `LoadingState` by TS,
// allowing access to `currentState.dataId` if we perform a type check:
if (currentState.type === StateType.Loading) {
  console.log(`Loading for ID: ${currentState.dataId}`);
}

// Attempt an invalid transition: Loading -> Reset (Should be ignored, stay Loading)
currentState = transition(currentState, { type: EventType.Reset });
console.log("Current State after Invalid Reset:", currentState);

// Attempt a valid transition: Loading -> Success
currentState = transition(currentState, { type: EventType.Resolve, data: "User data fetched successfully!" });
console.log("Current State after Resolve:", currentState);
// Now `currentState` is `SuccessState`, allowing access to `currentState.data`
if (currentState.type === StateType.Success) {
  console.log(`Fetched Data: ${currentState.data}`);
}

// Attempt an invalid transition: Success -> Load (Should be ignored, stay Success)
currentState = transition(currentState, { type: EventType.Load, dataId: "another-id" });
console.log("Current State after Invalid Load:", currentState);

// Attempt a valid transition: Success -> Idle
currentState = transition(currentState, { type: EventType.Reset });
console.log("Current State after Reset:", currentState);

// Simulate an error flow: Idle -> Loading -> Error -> Idle
currentState = transition(currentState, { type: EventType.Load, dataId: "product-456" });
console.log("Current State after another Load:", currentState);

currentState = transition(currentState, { type: EventType.Reject, message: "Network connection lost." });
console.log("Current State after Reject:", currentState);
// Now `currentState` is `ErrorState`, allowing access to `currentState.message`
if (currentState.type === StateType.Error) {
  console.log(`Error Message: ${currentState.message}`);
}

currentState = transition(currentState, { type: EventType.Reset });
console.log("Current State after final Reset:", currentState);

console.log("--- FSM Simulation End ---");

// This pattern is incredibly powerful for UI components, data fetching lifecycles,
// game states, and any system where an entity progresses through well-defined states.
// It leverages TypeScript's type system to catch potential logic errors at compile-time,
// rather than runtime, making your code more predictable and maintainable.