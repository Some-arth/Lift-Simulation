const liftForm = document.getElementById("liftForm");
const liftSystem = document.getElementById("liftSystem");
let floors = [];
let liftsDetail = [];
let requestQueue = [];
let pendingRequests = {};
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
}

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
}

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
    liftsDetail.push({ currentFloor: 0, busy: false, doorClosing: false });
  }
};

const buttonHandler = (e) => {
  const floor = Number(e.target.id.match(/\d+/)[0]);

  let liftOnFloor = liftsDetail.find(lift => lift.currentFloor === floor);

  if (liftOnFloor && !liftOnFloor.busy) {
    const liftElement = document.getElementById(`lift${liftsDetail.indexOf(liftOnFloor)}`);
    
    if (liftOnFloor.doorClosing) {
      clearTimeout(liftOnFloor.doorTimeout);
      liftOnFloor.doorClosing = false;
      openDoors(liftElement);
      liftOnFloor.doorTimeout = setTimeout(() => {
        closeDoors(liftElement);
        liftOnFloor.busy = false;
      }, 2500);
    } else {
      openDoors(liftElement);
      clearTimeout(liftOnFloor.doorTimeout);
      liftOnFloor.busy = true;
      liftOnFloor.doorTimeout = setTimeout(() => {
        closeDoors(liftElement);
        liftOnFloor.busy = false;
      }, 2500);
    }
    return;
  }

  if (pendingRequests[floor]) {
    return;
  }

  pendingRequests[floor] = true;
  requestQueue.push(floor);

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
  const floor = requestQueue.shift();
  callClosestLift(floor);
}

const callClosestLift = (floor) => {
  let liftIndex = -1;
  let minDistance = Infinity;

  for (let i = 0; i < liftsDetail.length; i++) {
    const lift = liftsDetail[i];
    if (!lift.busy && Math.abs(floor - lift.currentFloor) < minDistance) {
      minDistance = Math.abs(floor - lift.currentFloor);
      liftIndex = i;
    }
  }

  if (liftIndex >= 0) {
    moveLift(liftIndex, floor);
  } else {
    requestQueue.push(floor);
  }
};

const moveLift = (liftIndex, requestedFloor) => {
  const lift = liftsDetail[liftIndex];
  const liftElement = document.getElementById(`lift${liftIndex}`);
  const distance = Math.abs(requestedFloor - lift.currentFloor);
  const time = distance * 2000;
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
        pendingRequests[requestedFloor] = false;
      }, 2500);
    }, 3000);
  }, time);
};

const openDoors = (liftElement) => {
  const leftDoor = liftElement.querySelector(".left_door");
  const rightDoor = liftElement.querySelector(".right_door");

  leftDoor.style.transform = "translateX(-100%)";
  rightDoor.style.transform = "translateX(100%)";
}

const closeDoors = (liftElement) => {
  const liftIndex = liftElement.id.match(/\d+/)[0];
  liftsDetail[liftIndex].doorClosing = true;

  const leftDoor = liftElement.querySelector(".left_door");
  const rightDoor = liftElement.querySelector(".right_door");

  leftDoor.style.transform = "translateX(0)";
  rightDoor.style.transform = "translateX(0)";
}
