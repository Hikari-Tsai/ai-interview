export interface VisitHistory { key: string; ids: string[]; cursor: number }
export function historyFor(previous: VisitHistory | undefined, key: string, current: string): VisitHistory {
 if(previous?.key===key && previous.ids[previous.cursor]===current)return previous;
 return {key,ids:[current],cursor:0};
}
export function recordVisit(history: VisitHistory, id: string, direction: 'previous'|'next'): VisitHistory {
 const offset=direction==='previous'?-1:1;
 if(history.ids[history.cursor+offset]===id)return {...history,cursor:history.cursor+offset};
 return {...history,ids:[...history.ids.slice(0,history.cursor+1),id],cursor:history.cursor+1};
}
