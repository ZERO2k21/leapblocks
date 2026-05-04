
import { LCD1602Element } from './lcd1602-element';
import { safeDefine } from './utils/safe-define';

export class LCD2004Element extends LCD1602Element {
  protected numCols = 20;
  protected numRows = 4;
}

safeDefine('leap-lcd2004', LCD2004Element);
