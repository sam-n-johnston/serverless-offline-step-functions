import { StateTypeExecutor } from './StateTypeExecutor';
import { StateType } from './StateType';
import { TaskExecutor } from './executors/TaskExecutor';
import { PassExecutor } from './executors/PassExecutor';
import { WaitExecutor } from './executors/WaitExecutor';
import { ChoiceExecutor } from './executors/ChoiceExecutor';
import { FailExecutor } from './executors/FailExecutor';
import { SucceedExecutor } from './executors/SucceedExecutor';
import { MapExecutor } from './executors/MapExecutor';

export class StateTypeExecutorFactory {
  private static STATE_TYPE_MAP = new Map<StateType, StateTypeExecutor>([
    [StateType.Task, new TaskExecutor()],
    [StateType.Pass, new PassExecutor()],
    [StateType.Wait, new WaitExecutor()],
    [StateType.Choice, new ChoiceExecutor()],
    [StateType.Fail, new FailExecutor()],
    [StateType.Succeed, new SucceedExecutor()],
    [StateType.Map, new MapExecutor()],
  ]);

  public static getExecutor(type: StateType): StateTypeExecutor {
    const stateTypeExecutor = this.STATE_TYPE_MAP.get(type);

    if (!stateTypeExecutor) {
      throw new Error(`State of Type "${type}" is not supported yet.`);
    }

    return stateTypeExecutor;
  }
}
