import React from "react";

const MidHeader = ({ isAIMode, setIsAIMode }) => {
  return (
    <div className="w-full justify-between flex">
      <div className=" md:flex px-2 py-4">
        <h2 className="text-xl mr-10 w-96 font-bold ">Incoming Emergencies</h2>
        <div className="h-7 text-sm items-center flex w-full justify-between text-myGrey font-bold">
          <h3 className="text-red-600">Emergencies</h3>
          <h3>Scheduling</h3>
          <h3>Progress</h3>
          <h3>Forms</h3>
          <h3>More</h3>
        </div>
      </div>
      <div className="lg:opacity-100 opacity-0 w-full ml-4 relative">
        <img
          className="absolute top-3 left-6 w-8 h-8 object-cover rounded-full"
          src="https://www.canberratimes.com.au/images/transform/v1/crop/frm/silverstone-ct-migration/75ccaf32-220f-42c5-8a8e-80ee26fb25ad/r0_0_4256_2832_w1200_h678_fmax.jpg"
        />
        <img
          className="absolute top-3 left-12 w-8 h-8 object-cover rounded-full"
          src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRE-6u_IQ_vtTjrG3l9uEHqF4KzVArOjIWPWA0SM8-ZuunuXjwTyaD5uIjxqsuytj8Ufj8&usqp=CAU"
        />
        <img
          className="absolute top-3 left-[4.5rem] w-8 h-8 object-cover rounded-full"
          src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS0S2kZGgmAnbD4F-MAiXaYqnsuuHfip4qiMrSH5-fL-OdI_jy9JEpJX7P4MBDFMIEoQTc&usqp=CAU"
        />
        <img
          className="absolute top-3 left-24 w-8  h-8 object-cover rounded-full"
          src="https://www.canberratimes.com.au/images/transform/v1/crop/frm/130009714/17727cf1-8dd5-45a1-90a0-e67e074c54c5.jpg/r361_370_3453_2268_w1200_h678_fmax.jpg"
        />
      </div>
      <div className="py-4 flex justify-between items-center">
        <div className="flex gap-4 items-center">
          <h5 className="text-myGrey text-sm">Mode:</h5>
          <div className="flex items-center">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={isAIMode}
                onChange={() => setIsAIMode(!isAIMode)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:bg-blue-600 overflow-hidden after:content-[''] after:absolute after:top-1/2 after:-translate-y-1/2 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:left-auto peer-checked:after:right-0.5"></div>
              <span className="ml-3 text-sm font-medium text-gray-900">
                {isAIMode ? 'AI Mode' : 'Manual Mode'}
              </span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MidHeader;
