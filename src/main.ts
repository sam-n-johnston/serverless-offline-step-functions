import type { ServerlessOfflineStepFunctionsOptions } from './types/ServerlessOfflineStepFunctionsOptions';
import type {
  CLIOptions,
  ServerlessOfflineStepFunctionsCommands,
} from './types/ServerlessOfflineStepFunctionsCommands';
import type { ServerlessOfflineHooks } from './types/ServerlessOfflineHooks';
import { StepFunctionSimulatorServer } from './StepFunctionSimulatorServer';
import { StateInfoHandler } from './StateInfoHandler';

class ServerlessOfflineStepFunctionsPlugin {
  public hooks: ServerlessOfflineHooks;
  public commands: ServerlessOfflineStepFunctionsCommands;

  private serverless: any;
  private cliOptions: CLIOptions;
  private options?: ServerlessOfflineStepFunctionsOptions;
  private stepFunctionSimulatorServer?: StepFunctionSimulatorServer;

  constructor(serverless: any, cliOptions: CLIOptions) {
    this.serverless = serverless;
    this.cliOptions = cliOptions;

    this.commands = {
      '@fernthedev/serverless-offline-step-functions': {
        options: {
          port: {
            required: false,
            usage: 'Port of the Step Functions API Simulator',
          },
        },
      },
    };

    this.hooks = {
      'before:offline:start:init': this.start.bind(this),
      'offline:start:init': this.ready.bind(this),
      'offline:start:end': this.end.bind(this),
    };
  }

  private start() {
    this.mergeOptions();

    // Get Handler and Path of the Local Functions
    const definedStateMachines = this.serverless.service.initialServerlessConfig?.stepFunctions?.stateMachines;

    this.resolveHandlers(definedStateMachines);

    this.stepFunctionSimulatorServer = new StepFunctionSimulatorServer({
      port: this.options?.port || 8014,
      stateMachines: definedStateMachines,
    });
  }

  private ready() {
    return this.stepFunctionSimulatorServer?.initServer();
  }

  private async end() {
    await this.stepFunctionSimulatorServer?.shutdown();
  }

  private mergeOptions() {
    const custom = this.serverless.service.custom;
    const customOptions = custom['@fernthedev/serverless-offline-step-functions'];

    // order of Precedence: command line options, custom options, defaults.
    this.options = {
      ...this.cliOptions,
      ...customOptions,
    };
  }

  private resolveHandlers(definedStateMachines: any) {
    const definedFunctions = this.serverless.service.initialServerlessConfig.functions;
    const statesInfoHandler = StateInfoHandler.getInstance();
    const definedStateMachinesArr = Object.entries(definedStateMachines);

    for (const [stateMachineName, stateMachineOptions] of definedStateMachinesArr) {
      // Per StateMachine
      const states = Object.entries((stateMachineOptions as any).definition.States);

      for (const [stateName, stateOptions] of states) {
        // Per State in the StateMachine
        const functionName = stateOptions.Resource.split('-').slice(-1)[0];
        const { handler } = definedFunctions[functionName];
        const indexOfHandlerNameSeparator = handler.lastIndexOf('.');
        const handlerPath = handler.substring(0, indexOfHandlerNameSeparator);
        const handlerName = handler.substring(indexOfHandlerNameSeparator + 1);

        statesInfoHandler.setStateInfo(stateMachineName, stateName, handlerPath, handlerName);
      }
    }
  }
}

export = ServerlessOfflineStepFunctionsPlugin;
