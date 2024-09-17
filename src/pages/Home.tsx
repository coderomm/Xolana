import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const Home = () => {
    const navigate = useNavigate();
    const handleNavigation = (blockchain: string) => {
        navigate(`/generate-mnemonic?blockchain=${blockchain}`)
    }
    return (
        <section className="px-3 py-4 md:max-w-[70%] mx-auto">
            <div className="flex flex-col gap-3 md:gap-10 mt-20">
                <div className="flex flex-col gap-3 text-white text-center">
                    <h1 className="text-4xl md:text-5xl text-center font-bold md:font-semibold">Solana Token Launchpad</h1>
                </div>
                <div className="flex items-center justify-center flex-col md:flex-row gap-3">
                    <button className="shadow-2xl shadow-neutral-800 border text-base bg-custom-gradient text-white font-bold
                    rounded-full py-3 px-[18px] w-full uppercase text-center
                    hover:bg-custom-gradient-none hover:bg-white hover:text-black md:w-56"
                        onClick={() => {
                            handleNavigation('solana')
                            toast.success("Solana selected. Generate a wallet to continue.")
                        }}>
                        Solana
                    </button>
                    <button className="shadow-2xl shadow-neutral-800 border text-base hover:bg-custom-gradient-none text-white hover:bg-white font-bold hover:text-black rounded-full py-3 px-[18px] w-full md:w-56
                    uppercase text-center" onClick={() => {
                            handleNavigation('ethereum')
                            toast.success("Ethereum selected. Generate a wallet to continue.")
                        }}>
                        Ethereum
                    </button>
                </div>
                <div className="pointer-events-none fixed top-1/2 left-1/2 -translate-x-1/2 translate-y-1/2 w-52 h-28 bg-fuchsia-500/80 blur-[120px]"></div>
            </div>
        </section>
    )
}
export default Home