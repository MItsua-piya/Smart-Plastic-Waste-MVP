import { Router, type IRouter } from "express";
import healthRouter from "./health";
import plasticLoopRouter from "./plastic-loop";

const router: IRouter = Router();

router.use(healthRouter);
router.use(plasticLoopRouter);

export default router;
