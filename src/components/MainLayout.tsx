import Navbar from "./Navbar"

const MainLayout = ({ children }: any) => {
	return (
		<div className="mx-auto max-w-[1700px] max-h-[820px] bg-black relative">
			<Navbar />
			<div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-500 to-green-500 opacity-20 z-0"></div>
			{children}
		</div>
	)
}

export default MainLayout
