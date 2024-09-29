const liftForm = document.getElementById("liftForm");
const liftSystem = document.getElementById("liftSystem");
let floors = [];
let liftsDetail = [];
let requestQueue = [];
let queueIntervalId;

liftForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const lifts = Number(document.getElementById("totalLifts").value);
  const floors = Number(document.getElementById("totalFloors").value);
  console.log(`Form submitted with ${lifts} lifts and ${floors} floors.`);
  displayFloorsAndLifts(lifts, floors);
  liftForm.style.display = "none";
});

const displayFloorsAndLifts = (liftsCount, floorsCount) => {
  console.log(`Displaying ${floorsCount} floors and ${liftsCount} lifts.`);
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
    
    const openButton =  document.createElement("button");
    openButton.innerText = "Open";
    openButton.classList.add("open_button");
    openButton.addEventListener("click", buttonHandler);
    
    const floorNumber = document.createElement("span");
    floorNumber.classList.add("floor_no");
    floorNumber.innerText = `Floor ${floorsCount - i - 1}`;

    const buttonsContainer = document.createElement("div");
    buttonsContainer.classList.add("buttonBox");
    if (floorsCount === 1) {
      buttonsContainer.appendChild(openButton);
    }
    else {
      if (i > 0) buttonsContainer.appendChild(upButton);
      buttonsContainer.appendChild(floorNumber);
      if (i < floorsCount - 1) buttonsContainer.appendChild(downButton);
    }

    floor.appendChild(buttonsContainer);
    liftSystem.appendChild(floor);
    floors.push(floor);
    console.log(`Added floor ${floorsCount - i - 1}.`);
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
    console.log(`Added lift ${i} at floor 0.`);
  }
};

const buttonHandler = (e) => {
  const button = e.target;

  if (button.innerText === "Open") {
    const lift = liftsDetail.find(lift => lift.currentFloor === 0); 
    if (lift) {
      const liftElement = document.getElementById(`lift${liftsDetail.indexOf(lift)}`);
      console.log(`Opening lift on floor 0.`);  

      openDoors(liftElement);

      setTimeout(() => {
        closeDoors(liftElement);
        console.log(`Closed doors for lift on floor 0.`);
      }, 3000);
    } else {
      console.log(`No lift found on floor 0.`);
    }
    return;  
  }

  
  const floor = Number(button.id.match(/\d+/)[0]);
  console.log(`Button pressed on floor ${floor}, action: ${button.innerText}.`);

  button.disabled = true;
  button.style.backgroundColor = 'cyan';

  requestQueue.push({ floor, button });
  console.log(`Request added to queue for floor ${floor}.`);

  if (!queueIntervalId) {
    queueIntervalId = setInterval(handleQueueInterval, 300);
    console.log("Started queue processing.");
  }
};

const handleQueueInterval = () => {
  if (!requestQueue.length) {
    clearInterval(queueIntervalId);
    queueIntervalId = null;
    console.log("Queue processing stopped.");
    return;
  }
  const { floor, button } = requestQueue.shift();
  console.log(`Processing request for floor ${floor}.`);
  callClosestLift(floor, button);
};

const callClosestLift = (floor, button) => {
  let liftIndex = -1;
  let minDistance = Infinity;

  for (let i = 0; i < liftsDetail.length; i++) {
    const lift = liftsDetail[i];
    const distance = Math.abs(floor - lift.currentFloor);
    if (!lift.busy && distance < minDistance) {
      minDistance = distance;
      liftIndex = i;
    }
  }

  if (liftIndex >= 0) {
    console.log(`Closest lift is lift ${liftIndex} with a distance of ${minDistance}.`);
    moveLift(liftIndex, floor, button);
  } else {
    console.log(`No available lifts. Re-queuing request for floor ${floor}.`);
    requestQueue.unshift({ floor, button });
  }
};

const moveLift = (liftIndex, requestedFloor, button) => {
  const lift = liftsDetail[liftIndex];
  const liftElement = document.getElementById(`lift${liftIndex}`);
  const distance = Math.abs(requestedFloor - lift.currentFloor);
  const time = distance * 2000;
  lift.busy = true;

  console.log(`Moving lift ${liftIndex} to floor ${requestedFloor} with a time of ${time / 1000} seconds.`);

  liftElement.style.transition = `transform ${time / 1000}s linear`;
  const floorHeight = document.querySelector('.floor').offsetHeight;
  liftElement.style.transform = `translateY(-${floorHeight * requestedFloor}px)`;

  setTimeout(() => {
    lift.currentFloor = requestedFloor;
    console.log(`Lift ${liftIndex} reached floor ${requestedFloor}.`);
    openDoors(liftElement);
    setTimeout(() => {
      closeDoors(liftElement);
      setTimeout(() => {
        lift.busy = false;
        console.log(`Lift ${liftIndex} is now free.`);
        button.disabled = false;
        button.style.backgroundColor = '';
      }, 2500);
    }, 3000);
  }, time);
};

const openDoors = (liftElement) => {
  console.log("Opening doors.");
  const leftDoor = liftElement.querySelector(".left_door");
  const rightDoor = liftElement.querySelector(".right_door");

  leftDoor.style.transform = "translateX(-100%)";
  rightDoor.style.transform = "translateX(100%)";
};

const closeDoors = (liftElement) => {
  console.log("Closing doors.");
  const leftDoor = liftElement.querySelector(".left_door");
  const rightDoor = liftElement.querySelector(".right_door");

  leftDoor.style.transform = "translateX(0)";
  rightDoor.style.transform = "translateX(0)";
};
