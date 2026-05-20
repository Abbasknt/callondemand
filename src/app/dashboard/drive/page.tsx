'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function DrivePage() {
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchFiles = async () => {
    setLoading(true);
    try {
        // Need to get access token from Firebase Auth here
        // const token = await getAccessToken();
        const response = await fetch('/api/drive/files', {
            headers: {
                // Authorization: `Bearer ${token}`
            }
        });
        const data = await response.json();
        setFiles(data.files || []);
    } catch (e) {
        console.error(e);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Google Drive</h1>
      <Button onClick={fetchFiles} disabled={loading}>
        {loading ? 'Loading...' : 'Fetch Files'}
      </Button>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
        {files.map((file: any) => (
          <Card key={file.id}>
            <CardHeader>
              <CardTitle>{file.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Type: {file.mimeType}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
