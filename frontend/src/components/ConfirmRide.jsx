import React from 'react'

const vehicleImages = {
    car: 'https://swyft.pl/wp-content/uploads/2023/05/how-many-people-can-a-uberx-take.jpg',
    moto: 'https://www.uber-assets.com/image/upload/f_auto,q_auto:eco,c_fill,h_638,w_956/v1649231091/assets/2c/7fa194-c954-49b2-9c6d-a3b8601370f5/original/Uber_Moto_Orange_312x208_pixels_Mobile.png',
    auto: 'https://www.uber-assets.com/image/upload/f_auto,q_auto:eco,c_fill,h_368,w_552/v1648431773/assets/1d/db8c56-0204-4ce4-81ce-56a11a07fe98/original/Uber_Auto_558x372_pixels_Desktop.png'
}

const ConfirmRide = (props) => {
    const selectedFare = props.fare?.[props.vehicleType]

    const handleConfirm = async () => {
        if (typeof props.setConfirmRidePanel === 'function') {
            props.setConfirmRidePanel(false)
        }
        if (typeof props.setVehicleFound === 'function') {
            props.setVehicleFound(true)
        }
        if (typeof props.createRide === 'function') {
            await props.createRide()
        }
    }

    return (
        <div className='relative pt-2 pb-4'>
            <h5 
                className='p-1 text-center w-full absolute -top-8 left-0 cursor-pointer' 
                onClick={() => props.setConfirmRidePanel?.(false)}
            >
                <i className="text-3xl text-gray-300 ri-arrow-down-wide-line"></i>
            </h5>
            <h3 className='text-2xl font-semibold mb-3'>Confirm your Ride</h3>

            <div className='flex gap-2 justify-between flex-col items-center'>
                <img className='h-20 object-contain' src={vehicleImages[props.vehicleType] || vehicleImages.car} alt="Vehicle" />
                <div className='w-full mt-3'>
                    <div className='flex items-center gap-5 p-3 border-b-2'>
                        <i className="ri-map-pin-user-fill text-lg"></i>
                        <div>
                            <h3 className='text-lg font-medium'>Pickup</h3>
                            <p className='text-sm -mt-1 text-gray-600'>{props.pickup || 'Select Pickup Location'}</p>
                        </div>
                    </div>
                    <div className='flex items-center gap-5 p-3 border-b-2'>
                        <i className="text-lg ri-map-pin-2-fill"></i>
                        <div>
                            <h3 className='text-lg font-medium'>Destination</h3>
                            <p className='text-sm -mt-1 text-gray-600'>{props.destination || 'Select Destination'}</p>
                        </div>
                    </div>
                    <div className='flex items-center gap-5 p-3'>
                        <i className="ri-currency-line text-lg"></i>
                        <div>
                            <h3 className='text-lg font-medium'>
                                {selectedFare !== undefined ? `₹${selectedFare}` : 'Calculating...'}
                            </h3>
                            <p className='text-sm -mt-1 text-gray-600'>Cash Payment</p>
                        </div>
                    </div>
                </div>
                <button 
                    onClick={handleConfirm}
                    disabled={selectedFare === undefined}
                    className='w-full mt-4 bg-green-600 disabled:bg-gray-400 active:bg-green-700 text-white font-semibold p-3 rounded-lg transition-all'
                >
                    Confirm
                </button>
            </div>
        </div>
    )
}

export default ConfirmRide