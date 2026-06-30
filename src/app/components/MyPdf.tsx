import { Document, Page, View, Text, StyleSheet  } from '@react-pdf/renderer';

const styles = StyleSheet.create({ page: { padding: 30, }, section: { margin: 10, padding: 10, }, });
const MyDocument = () => (
    <Document>
        <Page size="A4" style={styles.page}>
            <View style={styles.section}>
                <Text>Hello, this is a sample PDF text!</Text>
            </View>
            <View style={styles.section}>
                <Text>More content can go here.</Text>
            </View> 
        </Page> 
    </Document>);

export default MyDocument;