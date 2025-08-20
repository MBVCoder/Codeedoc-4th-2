const Heading = ({text , TextSize = "6xl"}: any) => {
	return (
		<div>
			<h1 className={`text-6xl text-transparent font-semibold bg-clip-text bg-gradient-to-r from-blue-500 to-green-500`}>{text}</h1>
			<hr className="w-1/2 mx-auto mt-2" />
		</div>
	)
}

export default Heading
