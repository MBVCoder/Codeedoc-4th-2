const Heading = ({ text, TextSize = "6xl" }: any) => {
  return (
    <div>
      <h1
        className={`text-center text-3xl sm:text-4xl xl:text-5xl text-transparent font-semibold bg-clip-text bg-gradient-to-r from-blue-500 to-green-500 line-clamp-1 overflow-hidden break-all`}
      >
        {text}
      </h1>
      <hr className="w-1/2 mx-auto mt-2" />
    </div>
  );
};

export default Heading;
