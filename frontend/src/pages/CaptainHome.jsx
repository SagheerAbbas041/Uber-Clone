import React, { useState, useEffect, useRef, useContext } from 'react';
import { Link } from 'react-router-dom';
import CaptainDetails from '../components/CaptainDetails';
import RidePopUp from '../components/RidePopUp';
import ConfirmRidePopUp from '../components/ConfirmRidePopUp';
import LiveTracking from '../components/LiveTracking'; // Live Map Component
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { SocketContext } from '../context/SocketContext';
import { CaptainDataContext } from '../context/CaptainContext';
import axios from 'axios';

const CaptainHome = () => {
    const [ridePopupPanel, setRidePopupPanel] = useState(false);
    const [confirmRidePopupPanel, setConfirmRidePopupPanel] = useState(false);

    const ridePopupPanelRef = useRef(null);
    const confirmRidePopupPanelRef = useRef(null);

    const [ride, setRide] = useState(null);

    const { socket } = useContext(SocketContext);
    const { captain } = useContext(CaptainDataContext);

    // 1. Join Socket Room & Push Real-Time Location Updates
    useEffect(() => {
        if (!captain || !captain._id) return;

        socket.emit('join', {
            userType: 'captain',
            userId: captain._id
        });

        const updateLocation = () => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        socket.emit('update-location-captain', {
                            userId: captain._id,
                            location: {
                                ltd: position.coords.latitude,
                                lng: position.coords.longitude
                            }
                        });
                    },
                    (error) => console.error('Error fetching captain geolocation:', error),
                    { enableHighAccuracy: true }
                );
            }
        };

        const locationInterval = setInterval(updateLocation, 10000);
        updateLocation();

        return () => clearInterval(locationInterval);
    }, [captain, socket]);

    // 2. Listen for Incoming Ride Requests
    useEffect(() => {
        if (!socket) return;

        const handleNewRide = (data) => {
            setRide(data);
            setRidePopupPanel(true);
        };

        socket.on('new-ride', handleNewRide);

        return () => {
            socket.off('new-ride', handleNewRide);
        };
    }, [socket]);

    // 3. Confirm Ride Action (Captain Acceptance)
    async function confirmRide() {
        if (!ride || !captain) return;

        try {
            const response = await axios.post(
                `${import.meta.env.VITE_BASE_URL}/rides/confirm`,
                {
                    rideId: ride._id,
                    captainId: captain._id,
                },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );

            if (response.status === 200) {
                setRidePopupPanel(false);
                setConfirmRidePopupPanel(true);
            }
        } catch (error) {
            console.error("Error confirming ride request:", error);
        }
    }

    // GSAP Panel Animations
    useGSAP(function () {
        if (ridePopupPanel) {
            gsap.to(ridePopupPanelRef.current, { transform: 'translateY(0%)' });
        } else {
            gsap.to(ridePopupPanelRef.current, { transform: 'translateY(100%)' });
        }
    }, [ridePopupPanel]);

    useGSAP(function () {
        if (confirmRidePopupPanel) {
            gsap.to(confirmRidePopupPanelRef.current, { transform: 'translateY(0%)' });
        } else {
            gsap.to(confirmRidePopupPanelRef.current, { transform: 'translateY(100%)' });
        }
    }, [confirmRidePopupPanel]);

    return (
        <div className='h-screen relative overflow-hidden'>
            {/* Overlay Header */}
            <div className='fixed p-6 top-0 flex items-center justify-between w-screen z-10 pointer-events-none'>
                <img 
                    className='w-16 pointer-events-auto' 
                    src="https://upload.wikimedia.org/wikipedia/commons/c/cc/Uber_logo_2018.png" 
                    alt="Uber Logo" 
                />
                <Link 
                    to='/captain-home' 
                    className='h-10 w-10 bg-white flex items-center justify-center rounded-full shadow-md pointer-events-auto'
                >
                    <i className="text-lg font-medium ri-logout-box-r-line"></i>
                </Link>
            </div>

            {/* Live Interactive Map Display */}
            <div className='h-3/5 w-screen z-0'>
                <LiveTracking />
            </div>

            {/* Captain Status Dashboard */}
            <div className='h-2/5 p-6 bg-white rounded-t-2xl shadow-lg relative z-10'>
                <CaptainDetails />
            </div>

            {/* Ride Proposal Popup Modal */}
            <div 
                ref={ridePopupPanelRef} 
                className='fixed w-full z-20 bottom-0 translate-y-full bg-white px-3 py-10 pt-12 rounded-t-3xl shadow-2xl'
            >
                <RidePopUp 
                    ride={ride} 
                    setRidePopupPanel={setRidePopupPanel} 
                    setConfirmRidePopupPanel={setConfirmRidePopupPanel} 
                    confirmRide={confirmRide}
                />
            </div>

            {/* Confirm Ride Details Popup Modal */}
            <div 
                ref={confirmRidePopupPanelRef} 
                className='fixed w-full h-screen z-30 bottom-0 translate-y-full bg-white px-3 py-10 pt-12'
            >
                <ConfirmRidePopUp 
                    ride={ride} 
                    setConfirmRidePopupPanel={setConfirmRidePopupPanel} 
                    setRidePopupPanel={setRidePopupPanel} 
                />
            </div>
        </div>
    );
};

export default CaptainHome;