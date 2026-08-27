import React, { useEffect, useRef, useState, useContext } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import axios from "axios";
import "remixicon/fonts/remixicon.css";
import LocationSearchPanel from "../components/LocationSearchPanel";
import VehiclePanel from "../components/VehiclePanel";
import ConfirmRide from "../components/ConfirmRide";
import LookingForDriver from "../components/LookingForDriver";
import WaitingForDriver from "../components/WaitingForDriver";
import { SocketContext } from "../context/SocketContext";
import { UserDataContext } from "../context/UserContext";
import { useNavigate } from "react-router-dom";
import LiveTracking from "../components/LiveTracking";

const Home = () => {
  const [pickup, setPickup] = useState("");
  const [destination, setDestination] = useState("");
  const [panelOpen, setPanelOpen] = useState(false);

  const vehiclePanelRef = useRef(null);
  const confirmRidePanelRef = useRef(null);
  const vehicleFoundRef = useRef(null);
  const waitingForDriverRef = useRef(null);
  const panelRef = useRef(null);
  const panelCloseRef = useRef(null);

  const pickupTimeoutRef = useRef(null);
  const destinationTimeoutRef = useRef(null);

  const [vehiclePanel, setVehiclePanel] = useState(false);
  const [confirmRidePanel, setConfirmRidePanel] = useState(false);
  const [vehicleFound, setVehicleFound] = useState(false);
  const [waitingForDriver, setWaitingForDriver] = useState(false);

  const [pickupSuggestions, setPickupSuggestions] = useState([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState([]);
  const [activeField, setActiveField] = useState(null);
  const [fare, setFare] = useState({});
  const [vehicleType, setVehicleType] = useState(null);
  const [ride, setRide] = useState(null);

  const navigate = useNavigate();
  const { socket } = useContext(SocketContext);
  const { user } = useContext(UserDataContext);

  useEffect(() => {
    if (!socket || !user?._id) return;

    socket.emit("join", { userType: "user", userId: user._id });

    const handleRideConfirmed = (rideData) => {
      setVehicleFound(false);
      setWaitingForDriver(true);
      setRide(rideData);
    };

    const handleRideStarted = (rideData) => {
      setWaitingForDriver(false);
      navigate("/riding", { state: { ride: rideData } });
    };

    socket.on("ride-confirmed", handleRideConfirmed);
    socket.on("ride-started", handleRideStarted);

    return () => {
      socket.off("ride-confirmed", handleRideConfirmed);
      socket.off("ride-started", handleRideStarted);
    };
  }, [user, socket, navigate]);

  const handlePickupChange = (e) => {
    const value = e.target.value;
    setPickup(value);

    if (pickupTimeoutRef.current) clearTimeout(pickupTimeoutRef.current);

    if (!value.trim() || value.trim().length < 3) {
      setPickupSuggestions([]);
      return;
    }

    pickupTimeoutRef.current = setTimeout(async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          `${import.meta.env.VITE_BASE_URL}/maps/get-suggestions`,
          {
            params: { input: value },
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setPickupSuggestions(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error(
          "Pickup suggestions error:",
          error?.response?.data || error.message
        );
        if (error?.response?.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
        }
        setPickupSuggestions([]);
      }
    }, 300);
  };

  const handleDestinationChange = (e) => {
    const value = e.target.value;
    setDestination(value);

    if (destinationTimeoutRef.current)
      clearTimeout(destinationTimeoutRef.current);

    if (!value.trim() || value.trim().length < 3) {
      setDestinationSuggestions([]);
      return;
    }

    destinationTimeoutRef.current = setTimeout(async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          `${import.meta.env.VITE_BASE_URL}/maps/get-suggestions`,
          {
            params: { input: value },
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setDestinationSuggestions(
          Array.isArray(response.data) ? response.data : []
        );
      } catch (error) {
        console.error(
          "Destination suggestions error:",
          error?.response?.data || error.message
        );
        if (error?.response?.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
        }
        setDestinationSuggestions([]);
      }
    }, 300);
  };

  const submitHandler = (e) => {
    e.preventDefault();
  };

  useGSAP(() => {
    if (!panelRef.current || !panelCloseRef.current) return;
    if (panelOpen) {
      gsap.to(panelRef.current, { height: "70%", padding: 24 });
      gsap.to(panelCloseRef.current, { opacity: 1 });
    } else {
      gsap.to(panelRef.current, { height: "0%", padding: 0 });
      gsap.to(panelCloseRef.current, { opacity: 0 });
    }
  }, [panelOpen]);

  useGSAP(() => {
    if (!vehiclePanelRef.current) return;
    gsap.to(vehiclePanelRef.current, {
      transform: vehiclePanel ? "translateY(0)" : "translateY(100%)",
    });
  }, [vehiclePanel]);

  useGSAP(() => {
    if (!confirmRidePanelRef.current) return;
    gsap.to(confirmRidePanelRef.current, {
      transform: confirmRidePanel ? "translateY(0)" : "translateY(100%)",
    });
  }, [confirmRidePanel]);

  useGSAP(() => {
    if (!vehicleFoundRef.current) return;
    gsap.to(vehicleFoundRef.current, {
      transform: vehicleFound ? "translateY(0)" : "translateY(100%)",
    });
  }, [vehicleFound]);

  useGSAP(() => {
    if (!waitingForDriverRef.current) return;
    gsap.to(waitingForDriverRef.current, {
      transform: waitingForDriver ? "translateY(0)" : "translateY(100%)",
    });
  }, [waitingForDriver]);

  async function findTrip() {
    if (!pickup || !destination) {
      alert("Please select both pickup and destination locations");
      return;
    }

    setVehiclePanel(true);
    setPanelOpen(false);

    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/rides/get-fare`,
        {
          params: { pickup, destination },
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setFare(response.data || {});
    } catch (error) {
      console.error(
        "Fare fetch error:",
        error?.response?.data || error.message
      );
    }
  }

  async function createRide() {
    if (!pickup || !destination || !vehicleType) {
      alert("Missing ride selection parameters");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/rides/create`,
        {
          pickup,
          destination,
          vehicleType,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.status === 201 || response.status === 200) {
        setConfirmRidePanel(false);
        setVehicleFound(true);
      }
    } catch (error) {
      console.error(
        "Create ride server error:",
        error?.response?.data || error.message
      );
      alert(
        error?.response?.data?.message ||
          "Failed to create ride. Please check backend logs."
      );
    }
  }

  return (
    <div className="h-screen relative overflow-hidden">
      <img
        className="w-16 absolute left-5 top-5 z-20 pointer-events-none"
        src="https://upload.wikimedia.org/wikipedia/commons/c/cc/Uber_logo_2018.png"
        alt="Uber Logo"
      />

      <div className="h-screen w-screen absolute top-0 left-0 z-0">
        <LiveTracking />
      </div>

      <div className="flex flex-col justify-end h-screen absolute top-0 w-full z-10 pointer-events-none">
        <div className="h-[30%] p-6 bg-white relative pointer-events-auto shadow-lg">
          <h5
            ref={panelCloseRef}
            onClick={() => setPanelOpen(false)}
            className="absolute opacity-0 right-6 top-6 text-2xl cursor-pointer"
          >
            <i className="ri-arrow-down-wide-line"></i>
          </h5>
          <h4 className="text-2xl font-semibold">Find a trip</h4>
          <form className="relative py-3" onSubmit={submitHandler}>
            <div className="line absolute h-16 w-1 top-[50%] -translate-y-1/2 left-5 bg-gray-700 rounded-full"></div>
            <input
              onClick={() => {
                setPanelOpen(true);
                setActiveField("pickup");
              }}
              value={pickup}
              onChange={handlePickupChange}
              className="bg-[#eee] px-12 py-2 text-lg rounded-lg w-full"
              type="text"
              placeholder="Add a pick-up location"
            />
            <input
              onClick={() => {
                setPanelOpen(true);
                setActiveField("destination");
              }}
              value={destination}
              onChange={handleDestinationChange}
              className="bg-[#eee] px-12 py-2 text-lg rounded-lg w-full mt-3"
              type="text"
              placeholder="Enter your destination"
            />
          </form>
          <button
            onClick={findTrip}
            className="bg-black text-white px-4 py-2 rounded-lg mt-3 w-full font-medium"
          >
            Find Trip
          </button>
        </div>
        <div
          ref={panelRef}
          className="bg-white h-0 pointer-events-auto overflow-hidden"
        >
          <LocationSearchPanel
            suggestions={
              activeField === "pickup"
                ? pickupSuggestions
                : destinationSuggestions
            }
            setPanelOpen={setPanelOpen}
            setVehiclePanel={setVehiclePanel}
            setPickup={setPickup}
            setDestination={setDestination}
            activeField={activeField}
          />
        </div>
      </div>

      {/* Vehicle Selection Drawer */}
      <div
        ref={vehiclePanelRef}
        className="fixed w-full z-30 bottom-0 translate-y-full bg-white px-3 py-10 pt-12 shadow-2xl"
      >
        <VehiclePanel
          selectVehicle={setVehicleType}
          fare={fare}
          setConfirmRidePanel={setConfirmRidePanel}
          setVehiclePanel={setVehiclePanel}
        />
      </div>

      {/* Confirm Ride Drawer */}
      <div
        ref={confirmRidePanelRef}
        className="fixed w-full z-40 bottom-0 translate-y-full bg-white px-3 py-6 pt-12 shadow-2xl"
      >
        <ConfirmRide
          createRide={createRide}
          pickup={pickup}
          destination={destination}
          fare={fare}
          vehicleType={vehicleType}
          setConfirmRidePanel={setConfirmRidePanel}
          setVehicleFound={setVehicleFound}
        />
      </div>

      {/* Looking For Driver Drawer */}
      <div
        ref={vehicleFoundRef}
        className="fixed w-full z-50 bottom-0 translate-y-full bg-white px-3 py-6 pt-12 shadow-2xl"
      >
        <LookingForDriver
          pickup={pickup}
          destination={destination}
          fare={fare}
          vehicleType={vehicleType}
          setVehicleFound={setVehicleFound}
        />
      </div>

      {/* Waiting For Driver Drawer */}
      <div
        ref={waitingForDriverRef}
        className="fixed w-full z-30 bottom-0 translate-y-full bg-white px-3 py-6 pt-12 shadow-2xl"
      >
        <WaitingForDriver
          ride={ride}
          setVehicleFound={setVehicleFound}
          setWaitingForDriver={setWaitingForDriver}
          waitingForDriver={waitingForDriver}
        />
      </div>
    </div>
  );
};

export default Home;