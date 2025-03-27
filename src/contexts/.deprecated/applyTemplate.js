// テンプレートを適用
const applyTemplate = (templateId) => {
  const template = templates.find(t => t.id === templateId);
  if (template && template.schedule) {
    console.log('Applying template:', {
      templateId,
      selectedWeek: new Date(selectedWeek).toISOString()
    });
    
    // まず現在の表示用にスケジュールを更新
    setSchedule(template.schedule);
    
    // デモモードの場合は現在の週の実際の日付に対してデータを適用
    if (demoMode) {
      try {
        // 週の日付を生成
        const weekDates = [];
        for (let i = 0; i < 7; i++) {
          const date = new Date(selectedWeek);
          date.setDate(date.getDate() + i);
          const dateStr = date.toISOString().split('T')[0];
          weekDates.push({ date, dateStr, dayKey: `day${i + 1}` });
        }
        
        console.log('Week dates:', weekDates);
        
        // 古いデータをクリア
        const keys = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('studySchedule_')) {
            keys.push(key);
          }
        }
        
        keys.forEach(key => localStorage.removeItem(key));
        
        // 新しいデータを保存
        weekDates.forEach(({ date, dateStr, dayKey }) => {
          const scheduleData = {};
          
          if (template.schedule[dayKey]) {
            Object.entries(template.schedule[dayKey]).forEach(([hourKey, item]) => {
              if (item) {
                scheduleData[hourKey] = {
                  ...item,
                  id: `demo-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                  date
                };
              }
            });
            
            if (Object.keys(scheduleData).length > 0) {
              localStorage.setItem(`studySchedule_${dateStr}`, JSON.stringify(scheduleData));
            }
          }
        });
        
        // 再読み込み
        fetchSchedule(selectedWeek, true);
      } catch (error) {
        console.error('Error applying template in demo mode:', error);
      }
      
      return true;
    }
    
    // Firestore モード - バグを回避するために書き直し
    if (currentUser) {
      const applyToFirestore = async () => {
        try {
          // 週の日付を生成
          const weekDates = [];
          for (let i = 0; i < 7; i++) {
            const date = new Date(selectedWeek);
            date.setDate(date.getDate() + i);
            weekDates.push({
              date: date,
              dayKey: `day${i + 1}`
            });
          }
          
          // 既存のデータをクリア
          const startDate = new Date(selectedWeek);
          const endDate = new Date(startDate);
          endDate.setDate(endDate.getDate() + 7);
          
          const schedulesRef = collection(db, `${COLLECTION_ID}/users/${currentUser.uid}/schedules`);
          const q = query(
            schedulesRef,
            where('date', '>=', startDate),
            where('date', '<', endDate)
          );
          
          const snapshot = await getDocs(q);
          
          // 既存のデータを削除
          for (const doc of snapshot.docs) {
            await deleteDoc(doc.ref);
          }
          
          // 新しいデータを作成
          for (const { date, dayKey } of weekDates) {
            const dayData = template.schedule[dayKey];
            if (!dayData) continue;
            
            for (const hourKey in dayData) {
              const item = dayData[hourKey];
              if (!item) continue;
              
              const hourNum = parseInt(hourKey.replace('hour', ''), 10);
              
              await addDoc(schedulesRef, {
                categoryId: item.categoryId,
                hour: hourNum,
                date,
                createdAt: serverTimestamp()
              });
            }
          }
          
          // データを再読み込み
          await fetchSchedule(selectedWeek, true);
        } catch (err) {
          console.error('Error applying template to Firestore:', err);
        }
      };
      
      // 非同期処理を開始
      applyToFirestore();
    }
    
    return true;
  }
  
  return false;
};
