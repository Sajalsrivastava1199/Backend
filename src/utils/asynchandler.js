const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next))
            .catch((error) => {
                next(error); // Pass the error to the next middleware
            });
    }
}

export default asyncHandler;

// const asyncHandler=()=>
// const asyncHandler = (fn) => ()=>{}
// const asyncHandler = (fn) => async()=>{}
//USING errodhandler function with try catch block
// const asyncHandler = (fn) => async (req, res, next) => {
//         try {
//             await fn(req, res, next); // Call the passed function with req, res, next
//         } catch (error) {
//             res.status(error.code || 500).json({
//                 success: false, 
//                 message: error.message || 'Internal Server Error',
//         })
//     };
// }