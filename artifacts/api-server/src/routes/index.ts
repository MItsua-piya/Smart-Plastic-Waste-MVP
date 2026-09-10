import { Router, type IRouter } from "express";
import healthRouter from "./health";
import plasticLoopRouter from "./plastic-loop";
import authRouter from "./auth";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(plasticLoopRouter);

export default router;
