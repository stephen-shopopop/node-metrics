// import { EventLoopDelayPlugin } from '../src/library/plugins/event-loop-delay.js';
// import { monitorEventLoopDelay } from 'node:perf_hooks';
// import { DEFAULT_RESOLUTION } from '../src/library/constants.js';

// jest.mock('node:perf_hooks', () => {
//   const histogramMock = {
//     enable: jest.fn(),
//     reset: jest.fn(),
//     mean: 0
//   };
//   return {
//     monitorEventLoopDelay: jest.fn(() => histogramMock)
//   };
// });

// describe('EventLoopDelayPlugin', () => {
//   let plugin: EventLoopDelayPlugin;
//   let ctx: { set: jest.Mock; get: jest.Mock };
//   let histogramMock: any;

//   beforeEach(() => {
//     (monitorEventLoopDelay as jest.Mock).mockClear();
//     histogramMock = {
//       enable: jest.fn(),
//       reset: jest.fn(),
//       mean: 0
//     };
//     (monitorEventLoopDelay as jest.Mock).mockReturnValue(histogramMock);

//     ctx = {
//       set: jest.fn(),
//       get: jest.fn()
//     };
//     plugin = new EventLoopDelayPlugin();
//   });

//   it('should initialize with default resolution and enable histogram', () => {
//     expect(monitorEventLoopDelay).toHaveBeenCalledWith({ resolution: DEFAULT_RESOLUTION });
//     expect(histogramMock.enable).toHaveBeenCalled();
//     expect(plugin.name).toBe('EventLoopDelayPlugin');
//   });

//   it('should initialize with custom resolution', () => {
//     const customResolution = 123;
//     plugin = new EventLoopDelayPlugin(customResolution);
//     expect(monitorEventLoopDelay).toHaveBeenCalledWith({ resolution: customResolution });
//   });

//   it('should set eventLoopDelay to mean/resolution in ms minus resolution', () => {
//     histogramMock.mean = 5e6; // 5 ms in ns
//     ctx.get.mockReturnValue(0);

//     plugin.capture(ctx as any);

//     // (5e6 / 1e6) - DEFAULT_RESOLUTION = 5 - DEFAULT_RESOLUTION
//     expect(ctx.set).toHaveBeenCalledWith('eventLoopDelay', Math.max(0, 5 - DEFAULT_RESOLUTION));
//     expect(histogramMock.reset).toHaveBeenCalled();
//   });

//   it('should set eventLoopDelay to 0 if mean/resolution is less than resolution', () => {
//     histogramMock.mean = 0.5e6; // 0.5 ms in ns
//     ctx.get.mockReturnValue(0);

//     plugin.capture(ctx as any);

//     expect(ctx.set).toHaveBeenCalledWith('eventLoopDelay', 0);
//     expect(histogramMock.reset).toHaveBeenCalled();
//   });

//   it('should set eventLoopDelay to Infinity if computed value is NaN', () => {
//     histogramMock.mean = Number.NaN;
//     ctx.get.mockReturnValue(Number.NaN);

//     plugin.capture(ctx as any);

//     expect(ctx.set).toHaveBeenCalledWith('eventLoopDelay', Number.POSITIVE_INFINITY);
//     expect(histogramMock.reset).toHaveBeenCalled();
//   });
// });
