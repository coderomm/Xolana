import { useEffect, useRef } from 'react';
import { useRecoilState } from "recoil";
import { SideBarOpen } from "../../atoms/sidebarAtom";
import { CircleX } from 'lucide-react';

const Sidebar = () => {

    const modalRef = useRef<HTMLDivElement | null>(null);
    const [isOpen, setIsOpen] = useRecoilState(SideBarOpen);

    const handleToggleModal = () => {
        setIsOpen(!isOpen);
    };

    const handleClickOutside = (event: MouseEvent) => {
        if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
            setIsOpen(false);
        }
    };

    useEffect(() => {
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return <>
        <aside className={`fixed left-0 top-0 z-10 h-[100vh] w-full overflow-hidden transition-all duration-300 ${isOpen ? "pointer-events-all opacity-100" : "pointer-events-none opacity-0"}`}>
            <div className="absolute inset-0 transition-opacity bg-[#00000080]"></div>
            <button className={`${isOpen ? "fixed" : "hidden"} top-6 right-4 lg:top-7 lg:right-20 bg-black`} onClick={handleToggleModal}>
                <CircleX />
            </button>
            <div className={`relative mr-auto transition-transform duration-300 ease-in-out flex flex-col max-w-[285px] px-2 py-4 h-[100vh] gap-4 bg-[#09090b] justify-between ${isOpen ? "translate-x-0" : "-translate-x-full"}`} ref={modalRef}>
                <div className="w-full flex flex-col gap-6 items-center mt-20">
                    <div className="w-full flex flex-col gap-3 md:gap-3">
                        <a href='crypto-kosh.vercel.app' className='rounded cursor-pointer transition-transform transform active:scale-95 hover:bg-white/30 px-5 py-2 backdrop-blur-lg backdrop-saturate-150 shadow-lg border border-[#434348]'>CryptoKosh Wallet</a>
                        <a href='raydium-liquidity-pool.vercel.app' className='rounded  cursor-pointer transition-transform transform active:scale-95 hover:bg-white/30 px-5 py-2 backdrop-blur-lg backdrop-saturate-150 shadow-lg border border-[#434348]'>Raydium Liquidity Pool</a>
                    </div>
                </div>
                <div className="border-t border-[#222] py-10">
                    <div className="gap-3 items-center justify-center hidden">
                        <button className='rounded-full p-2 bg-[#1d1d1d] w-12 h-12 text-center color-[#cfcfcf] iconhoverActive md:iconhover flex justify-center items-center'>Create Token</button>
                        <button className='rounded-full p-2 bg-[#1d1d1d] w-12 h-12 text-center color-[#cfcfcf] iconhoverActive md:iconhover flex justify-center items-center'>Create Token 22</button>
                        <button className='rounded-full p-2 bg-[#1d1d1d] w-12 h-12 text-center color-[#cfcfcf] iconhoverActive md:iconhover flex justify-center items-center'>Airdrop</button>
                    </div>
                </div>
            </div>
        </aside>
    </>
}

export default Sidebar;