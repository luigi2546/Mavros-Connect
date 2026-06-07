import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import tenantsRouter from "./tenants";
import locationsRouter from "./locations";
import usersRouter from "./users";
import routersRouter from "./routers";
import packagesRouter from "./packages";
import vouchersRouter from "./vouchers";
import paymentsRouter from "./payments";
import sessionsRouter from "./sessions";
import dashboardRouter from "./dashboard";
import portalRouter from "./portal";
import analyticsRouter from "./analytics";
import reportingRouter from "./reporting";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(tenantsRouter);
router.use(locationsRouter);
router.use(usersRouter);
router.use(routersRouter);
router.use(packagesRouter);
router.use(vouchersRouter);
router.use(paymentsRouter);
router.use(sessionsRouter);
router.use(dashboardRouter);
router.use(portalRouter);
router.use(analyticsRouter);
router.use(reportingRouter);

export default router;
