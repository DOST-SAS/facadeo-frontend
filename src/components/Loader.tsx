
const LoaderSpin = () => {
    return (
        <div className="h-screen flex justify-center items-center bg-background fixed inset-0 z-50">
            {Array.from({ length: 5 }).map((_, index) => (
                <div
                    key={index}
                    className="w-[5px] h-[25px] bg-primary m-[5px] animate-[wave_1s_linear_infinite] rounded-[20px]"
                    style={{ animationDelay: `${index * 0.1}s` }}
                ></div>
            ))}
        </div>
    )
}

export default LoaderSpin