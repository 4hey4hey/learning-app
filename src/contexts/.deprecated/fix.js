// デモモード用のヘルパー関数
// スケジュールの取得 - デモモード用
const fetchDemoSchedule = async (startDate) => {
  try {
    console.log('Fetching demo schedule for week:', new Date(startDate).toISOString());
    
    // 週の各日付を解析
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
      weekDates.push({ date, dateStr, dayKey: `day${i + 1}` });
    }
    
    // 空の週間スケジュールを作成
    const emptySchedule = generateEmptyWeekSchedule();
    
    // LocalStorageから各日付のデータを読み込み
    for (const { dateStr, dayKey } of weekDates) {
      const storageKey = `studySchedule_${dateStr}`;
      try {
        const savedData = localStorage.getItem(storageKey);
        if (savedData) {
          const parsedData = JSON.parse(savedData);
          console.log(`Found data for ${dateStr} (${dayKey}):`, parsedData);
          
          // 各時間帯のデータをスケジュールに追加
          Object.entries(parsedData).forEach(([hourKey, item]) => {
            if (emptySchedule[dayKey] && emptySchedule[dayKey][hourKey]) {
              emptySchedule[dayKey][hourKey] = item;
            }
          });
        } else {
          console.log(`No data found for ${dateStr} (${dayKey})`);
        }
      } catch (error) {
        console.error(`Error parsing data for ${dateStr}:`, error);
      }
    }
    
    console.log('Final demo schedule:', emptySchedule);
    return emptySchedule;
  } catch (error) {
    console.error('Error in fetchDemoSchedule:', error);
    return generateEmptyWeekSchedule();
  }
};

// スケジュールの更新 - デモモード用
const updateDemoScheduleItem = (day, hour, categoryId, date, schedule, categories, setSchedule) => {
  try {
    console.log('Updating demo schedule item:', { day, hour, categoryId, date: new Date(date).toISOString() });
    
    // 日付文字列を生成 (YYYY-MM-DD)
    const dateStr = date.toISOString().split('T')[0];
    const storageKey = `studySchedule_${dateStr}`;
    
    // 日付のデータを取得または作成
    let dayData = {};
    try {
      const savedData = localStorage.getItem(storageKey);
      if (savedData) {
        dayData = JSON.parse(savedData);
      }
    } catch (error) {
      console.error(`Error reading data for ${dateStr}:`, error);
    }
    
    // 現在のスケジュールを更新
    const updatedSchedule = { ...schedule };
    
    if (categoryId) {
      // カテゴリを設定する場合
      const category = categories.find(c => c.id === categoryId);
      const newItem = {
        id: `demo-schedule-${Date.now()}`,
        categoryId,
        name: category?.name || '',
        color: category?.color || '#ccc',
        date: date
      };
      
      // 表示用スケジュールを更新
      updatedSchedule[day][hour] = newItem;
      
      // 保存用データを更新
      dayData[hour] = newItem;
      console.log(`Adding item to ${storageKey}:`, newItem);
    } else {
      // カテゴリを削除する場合
      updatedSchedule[day][hour] = null;
      
      // 保存用データからも削除
      if (dayData[hour]) {
        delete dayData[hour];
        console.log(`Removing item from ${storageKey}: ${hour}`);
      }
    }
    
    // スケジュールを更新
    setSchedule(updatedSchedule);
    
    // LocalStorageに保存
    if (Object.keys(dayData).length > 0) {
      localStorage.setItem(storageKey, JSON.stringify(dayData));
      console.log(`Saved data to ${storageKey}:`, dayData);
    } else {
      localStorage.removeItem(storageKey);
      console.log(`Removed empty data at ${storageKey}`);
    }
    
    return true;
  } catch (error) {
    console.error('Error in updateDemoScheduleItem:', error);
    return false;
  }
};

// テンプレート適用 - デモモード用
const applyDemoTemplate = async (template, selectedWeek, setSchedule) => {
  try {
    console.log('Applying demo template:', {
      template,
      selectedWeek: new Date(selectedWeek).toISOString()
    });
    
    // 現在の週の日付を取得
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(selectedWeek);
      date.setDate(date.getDate() + i);
      weekDates.push({
        date: date,
        dateStr: date.toISOString().split('T')[0], // YYYY-MM-DD 形式
        dayKey: `day${i + 1}`
      });
    }
    
    console.log('Week dates for template application:', weekDates.map(d => ({ 
      dateStr: d.dateStr, 
      dayKey: d.dayKey 
    })));
    
    // 古いデータを毒出し
    const oldStorageKeys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('studySchedule_')) {
        oldStorageKeys.push(key);
      }
    }
    
    console.log('Old storage keys to be cleared:', oldStorageKeys);
    
    // 古いデータを削除
    oldStorageKeys.forEach(key => {
      localStorage.removeItem(key);
    });
    
    // テンプレートの各日のデータを適切な実際の日付に適用
    weekDates.forEach(({ date, dateStr, dayKey }) => {
      const daySchedule = {};
      
      Object.keys(template.schedule[dayKey] || {}).forEach(hourKey => {
        const item = template.schedule[dayKey][hourKey];
        if (item) {
          const newItem = {
            ...item,
            id: `demo-schedule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            date: date
          };
          daySchedule[hourKey] = newItem;
        }
      });
      
      // 日付ごとにローカルストレージに保存
      if (Object.keys(daySchedule).length > 0) {
        const storageKey = `studySchedule_${dateStr}`;
        localStorage.setItem(storageKey, JSON.stringify(daySchedule));
        console.log(`Saved template data to ${storageKey}:`, daySchedule);
      }
    });
    
    // まず現在の表示用にスケジュールを更新
    setSchedule(template.schedule);
    
    return true;
  } catch (error) {
    console.error('Error applying demo template:', error);
    return false;
  }
};
