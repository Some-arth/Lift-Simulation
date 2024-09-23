const liftForm = document.getElementById("liftForm");
const liftSystem = document.getElementById("liftSystem");
let floors = [];
let liftsDetail = [];
let requestQueue = [];
let pendingRequests = {}; // Track if a floor is pending
let activeRequests = {}; // Track active requests
let queueIntervalId;

liftForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const lifts = Number(document.getElementById("totalLifts").value);
  const floors = Number(document.getElementById("totalFloors").value);
  displayFloorsAndLifts(lifts, floors);
  liftForm.style.display = "none";
});

const displayFloorsAndLifts = (liftsCount, floorsCount) => {
  displayFloors(floorsCount, liftsCount);
  displayLifts(liftsCount);
};

const displayFloors = (floorsCount, liftsCount) => {
  const viewportWidth = window.innerWidth;
  const requiredWidth = 70 * liftsCount + 80;

  for (let i = 0; i < floorsCount; i++) {
    const floor = document.createElement("div");
    floor.classList.add("floor");
    floor.id = `floor${floorsCount - i - 1}`;
    floor.style.width = viewportWidth > requiredWidth
      ? `${viewportWidth}px`
      : `${requiredWidth}px`;

    const upButton = document.createElement("button");
    upButton.innerText = "Up";
    upButton.id = `up${floorsCount - i - 1}`;
    upButton.classList.add("up_button");
    upButton.addEventListener("click", buttonHandler);

    const downButton = document.createElement("button");
    downButton.innerText = "Down";
    downButton.id = `down${floorsCount - i - 1}`;
    downButton.classList.add("down_button");
    downButton.addEventListener("click", buttonHandler);

    const floorNumber = document.createElement("span");
    floorNumber.classList.add("floor_no");
    floorNumber.innerText = `Floor ${floorsCount - i - 1}`;

    const buttonsContainer = document.createElement("div");
    buttonsContainer.classList.add("buttonBox");
    if (i > 0) buttonsContainer.appendChild(upButton);
    buttonsContainer.appendChild(floorNumber);
    if (i < floorsCount - 1) buttonsContainer.appendChild(downButton);

    floor.appendChild(buttonsContainer);
    liftSystem.appendChild(floor);
    floors.push(floor);
  }
};

const displayLifts = (liftsCount) => {
  const liftSpacing = 80;
  for (let i = 0; i < liftsCount; i++) {
    const floor0 = document.getElementById("floor0");
    const lift = document.createElement("div");
    lift.classList.add("lift");
    lift.id = `lift${i}`;
    lift.style.left = `${50 + (i * liftSpacing)}px`;

    const leftDoor = document.createElement("div");
    leftDoor.classList.add("door", "left_door");
    lift.appendChild(leftDoor);

    const rightDoor = document.createElement("div");
    rightDoor.classList.add("door", "right_door");
    lift.appendChild(rightDoor);

    floor0.appendChild(lift);
    liftsDetail.push({ currentFloor: 0, busy: false });
  }
};

const buttonHandler = (e) => {
  const floor = Number(e.target.id.match(/\d+/)[0]);
  const direction = e.target.classList.contains('up_button') ? 'up' : 'down';

  // If a lift is already on this floor and was called in the same direction, reopen doors
  if (activeRequests[floor] && activeRequests[floor] === direction) {
    const liftIndex = liftsDetail.findIndex(lift => lift.currentFloor === floor && lift.busy);
    if (liftIndex >= 0) {
      reopenDoors(liftIndex);
      return;
    }
  }

  // If the floor is already pending, ignore the new request
  if (pendingRequests[floor]) {
    return;
  }

  // Add to request queue and mark it as pending
  pendingRequests[floor] = true;
  requestQueue.push({ floor, direction });
  activeRequests[floor] = direction;

  if (!queueIntervalId) {
    queueIntervalId = setInterval(handleQueueInterval, 100);
  }
};

const handleQueueInterval = () => {
  if (!requestQueue.length) {
    clearInterval(queueIntervalId);
    queueIntervalId = null;
    return;
  }

  const request = requestQueue.shift();
  callClosestLift(request);
};

const callClosestLift = (request) => {
  let liftIndex = -1;
  let minDistance = Infinity;

  for (let i = 0; i < liftsDetail.length; i++) {
    const lift = liftsDetail[i];

    // Check if the lift can respond (not busy)
    if (!lift.busy) {
      const distance = Math.abs(request.floor - lift.currentFloor);
      if (distance < minDistance) {
        minDistance = distance;
        liftIndex = i;
      }
    }
  }

  // Move the closest lift if it's available and the direction is different
  if (liftIndex >= 0) {
    if (!activeRequests[request.floor] || (activeRequests[request.floor] !== request.direction)) {
      moveLift(liftIndex, request.floor);
    } else {
      requestQueue.push(request); // Re-add request if no lift can move
    }
  } else {
    requestQueue.push(request); // Re-add request if no lift can move
  }
};

const moveLift = (liftIndex, requestedFloor) => {
  const lift = liftsDetail[liftIndex];
  const liftElement = document.getElementById(`lift${liftIndex}`);
  const distance = Math.abs(requestedFloor - lift.currentFloor);
  const time = distance * 2000; // Assume 2 seconds per floor
  lift.busy = true;

  liftElement.style.transition = `transform ${time / 1000}s ease-in-out`;
  liftElement.style.transform = `translateY(-${110 * requestedFloor}px)`;

  setTimeout(() => {
    lift.currentFloor = requestedFloor;
    openDoors(liftElement);
    setTimeout(() => {
      closeDoors(liftElement);
      setTimeout(() => {
        lift.busy = false;
        // Remove this floor from pending requests and active requests
        delete pendingRequests[requestedFloor];
        delete activeRequests[requestedFloor];
      }, 2500); // Doors stay open for 2.5 seconds
    }, 3000); // Stay on the floor for 3 seconds
  }, time);
};

const reopenDoors = (liftIndex) => {
  const liftElement = document.getElementById(`lift${liftIndex}`);
  openDoors(liftElement);
  setTimeout(() => {
    closeDoors(liftElement);
  }, 2500); // Keep doors open for 2.5 seconds
};

const openDoors = (liftElement) => {
  const leftDoor = liftElement.querySelector(".left_door");
  const rightDoor = liftElement.querySelector(".right_door");

  leftDoor.style.transform = "translateX(-100%)";
  rightDoor.style.transform = "translateX(100%)";
};

const closeDoors = (liftElement) => {
  const leftDoor = liftElement.querySelector(".left_door");
  const rightDoor = liftElement.querySelector(".right_door");

  leftDoor.style.transform = "translateX(0)";
  rightDoor.style.transform = "translateX(0)";
};
